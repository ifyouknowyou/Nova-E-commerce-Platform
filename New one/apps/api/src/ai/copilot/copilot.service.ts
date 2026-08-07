import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../../hooks/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RbacService } from '../../rbac/rbac.service';
import { BusinessGraphService } from '../graph/business-graph.service';
import { businessGraphContext } from '../graph/graph-context';
import { LlmProviderFactory } from '../provider/llm.factory';
import type { LlmMessage } from '../provider/llm.provider';
import { ToolRegistry } from '../tools/tool.registry';
import { toLlmToolDef } from '../tools/tool.types';
import { ToolRunner } from '../tools/tool.runner';

const RESULT_MARKER = '[TOOL_RESULT]';

export interface CopilotResult {
  conversationId: string;
  messageId: string;
  answer: string;
  needsApproval?: string;
  evidence?: unknown;
  records?: unknown[];
}

/**
 * AI Copilot — ONE workspace, ONE data model, ONE AI context.
 * Answers + acts across the tenant's REAL data: every turn is grounded in the
 * RBAC-scoped Business Graph, and every tool call passes the ToolRunner, so
 * read/low tools execute in-tenant and sensitive actions become real approval
 * requests. Answers are built from real tool results / graph data — never canned.
 */
@Injectable()
export class CopilotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
    private readonly registry: ToolRegistry,
    private readonly runner: ToolRunner,
    private readonly graph: BusinessGraphService,
    private readonly factory: LlmProviderFactory,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async listConversations(orgId: string, userId: string) {
    return this.prisma.withTenant(orgId, (tx) =>
      tx.aiConversation.findMany({ where: { orgId, userId }, orderBy: { updatedAt: 'desc' }, take: 50 }),
    );
  }

  async conversation(orgId: string, id: string, userId: string) {
    const conv = await this.prisma.withTenant(orgId, (tx) =>
      tx.aiConversation.findFirst({ where: { id, orgId, userId } }),
    );
    if (!conv) return null;
    const messages = await this.prisma.withTenant(orgId, (tx) =>
      tx.aIChatMessage.findMany({ where: { conversationId: conv.id }, orderBy: { createdAt: 'asc' } }),
    );
    return { ...conv, messages };
  }

  async ask(orgId: string, userId: string, message: string, conversationId?: string): Promise<CopilotResult> {
    const convId =
      conversationId ??
      (await this.prisma.withTenant(orgId, (tx) =>
        tx.aiConversation.create({ data: { orgId, userId, title: message.slice(0, 60) } }),
      )).id;

    await this.persist(orgId, convId, 'USER', message);

    const perms = await this.rbac.getEffectivePermissions(orgId, userId);
    // Copilot exposes READ/LOW tools only — sensitive actions are Agent work.
    const readTools = this.registry.list().filter((t) => t.risk === 'READ' || t.risk === 'LOW');
    const allowed = this.registry.permitted(readTools, (code) => perms.includes(code));

    const provider = this.factory.getProvider(
      this.config.get<string>('aiApiKey') ?? '',
      this.config.get<string>('aiModel') ?? 'claude-opus-5',
    );
    const system = await this.assembleSystem(orgId, userId, perms);

    let answer = '';
    let needsApproval: string | undefined;
    let evidence: unknown;
    let records: unknown[] | undefined;

    for (let i = 0; i < 6; i += 1) {
      const result = await provider.complete({
        system,
        messages: await this.composeMessages(orgId, convId),
        tools: allowed.map(toLlmToolDef),
      });

      if (!result.toolCall) {
        answer = result.text ?? '';
        break;
      }

      const outcome = await this.runner.run(orgId, userId, result.toolCall.name, result.toolCall.input, {
        source: 'USER',
        conversationId: convId,
        why: message,
      });

      if (outcome.status === 'requires_approval') {
        needsApproval = outcome.approvalId;
        answer = `That action (${result.toolCall.name}) needs your approval first. I've created a request — approve it in the Approvals queue, then re-ask and I'll complete it.`;
        break;
      }
      if (outcome.status === 'denied_permission') {
        answer = `You don't have the permission needed to run ${result.toolCall.name}.`;
        break;
      }

      // Real result → persist as a TOOL row so the next pass answers from data.
      evidence = outcome.result;
      records = outcome.result.records ?? undefined;
      await this.persist(orgId, convId, 'TOOL', `${RESULT_MARKER} ${JSON.stringify(outcome.result)}`);
      await this.audit.record(orgId, 'EXECUTE', 'ai.copilot', convId, {
        actorId: userId, meta: { tool: result.toolCall.name, question: message },
      });
      // Loop continues: the provider sees the [TOOL_RESULT] and writes the answer
      // (deterministic provider summarizes it; Claude reasons over it).
      continue;
    }

    if (!answer) answer = "I don't have enough context to answer that yet.";
    await this.persist(orgId, convId, 'AGENT', answer, { evidence, records });

    const last = await this.prisma.withTenant(orgId, (tx) =>
      tx.aIChatMessage.findFirst({ where: { conversationId: convId, role: 'AGENT' }, orderBy: { createdAt: 'desc' }, select: { id: true } }),
    );
    return { conversationId: convId, messageId: last?.id ?? '', answer, needsApproval, evidence, records };
  }

  private async assembleSystem(orgId: string, userId: string, perms: string[]): Promise<string> {
    const graph = await this.graph.snapshot(orgId, userId);
    return businessGraphContext(graph, perms);
  }

  private async composeMessages(orgId: string, conversationId: string): Promise<LlmMessage[]> {
    const history = await this.prisma.withTenant(orgId, (tx) =>
      tx.aIChatMessage.findMany({ where: { conversationId }, orderBy: { createdAt: 'asc' } }),
    );
    const out: LlmMessage[] = [];
    for (const h of history) {
      if (h.role === 'USER') out.push({ role: 'user', content: h.content });
      else if (h.role === 'TOOL') out.push({ role: 'user', content: h.content });
      else if (h.role === 'AGENT') out.push({ role: 'assistant', content: h.content });
    }
    // Normalize: API requires a leading user turn and alternating roles; merge
    // adjacent same-role messages defensively.
    return normalizeMessages(out);
  }

  private async persist(
    orgId: string,
    conversationId: string,
    role: 'USER' | 'AGENT' | 'TOOL',
    content: string,
    meta: { evidence?: unknown; records?: unknown[] } = {},
  ) {
    await this.prisma.withTenant(orgId, (tx) =>
      tx.aIChatMessage.create({
        data: {
          orgId, conversationId, role,
          content,
          evidence: meta.evidence ? (meta.evidence as never) : undefined,
          records: meta.records ? (meta.records as never) : undefined,
        },
      }),
    );
  }
}

/** Defensively alternate user/assistant turns so the API never rejects history. */
export function normalizeMessages(messages: LlmMessage[]): LlmMessage[] {
  const out: LlmMessage[] = [];
  let prev = '';
  for (const m of messages) {
    if (prev === 'user' && m.role === 'user') {
      const last = out[out.length - 1] as LlmMessage;
      out[out.length - 1] = { role: 'user', content: `${last.content}\n\n${m.content}` };
      continue;
    }
    if (prev === 'assistant' && m.role === 'assistant') {
      const last = out[out.length - 1] as LlmMessage;
      out[out.length - 1] = { role: 'assistant', content: `${last.content}\n\n${m.content}` };
      continue;
    }
    out.push(m);
    prev = m.role;
  }
  return out;
}