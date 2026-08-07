import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiException } from '../../common/exceptions';
import { AuditService } from '../../hooks/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RbacService } from '../../rbac/rbac.service';
import { businessGraphContext } from '../graph/graph-context';
import { BusinessGraphService } from '../graph/business-graph.service';
import { LlmProviderFactory } from '../provider/llm.factory';
import type { LlmMessage } from '../provider/llm.provider';
import { ToolRegistry } from '../tools/tool.registry';
import { toLlmToolDef } from '../tools/tool.types';
import { ToolRunner } from '../tools/tool.runner';
import { AGENTS } from './agent.registry';

export interface AgentRunResult {
  runId: string;
  agent: string;
  status: 'RUNNING' | 'NEEDS_APPROVAL' | 'COMPLETED' | 'FAILED';
  output?: unknown;
  approvals: string[];
}

/**
 * AI Agents — autonomous, tenant-scoped workers with defined permissions.
 * Each run creates an AiAgentRun, proposes tool calls through the same
 * ToolRunner as the Copilot (READ/LOW execute; HIGH/SENSITIVE become real
 * approval requests, never silent execution), and records full audit state.
 */
@Injectable()
export class AgentService {
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

  list() {
    return AGENTS.map(({ key, name, description, tools }) => ({ key, name, description, tools }));
  }

  async run(orgId: string, agentKey: string, userId: string, prompt: string): Promise<AgentRunResult> {
    const agent = AGENTS.find((a) => a.key === agentKey);
    if (!agent) throw new ApiException('NOT_FOUND', { message: `Unknown agent: ${agentKey}` });

    const run = await this.prisma.withTenant(orgId, (tx) =>
      tx.aiAgentRun.create({
        data: { orgId, agentKey, status: 'RUNNING', brief: prompt, createdById: userId, input: { prompt } as never },
      }),
    );
    await this.audit.record(orgId, 'EXECUTE', 'ai.agent', run.id, { actorId: userId, meta: { agent: agentKey } });

    const perms = await this.rbac.getEffectivePermissions(orgId, userId);
    const agentTools = this.registry.list().filter((t) => agent.tools.includes(t.name));
    const allowed = this.registry.permitted(agentTools, (code) => perms.includes(code));

    const provider = this.factory.getProvider(
      this.config.get<string>('aiApiKey') ?? '',
      this.config.get<string>('aiModel') ?? 'claude-opus-5',
    );
    const graph = await this.graph.snapshot(orgId, userId);
    const system = [
      agent.persona,
      '',
      businessGraphContext(graph, perms),
      '',
      'Analyze, summarize, recommend, and prepare proposed actions. If a proposed ' +
        'action is high-risk it will require human approval before execution.',
    ].join('\n');

    const messages: LlmMessage[] = [{ role: 'user', content: prompt }];
    const approvals: string[] = [];
    const outputs: unknown[] = [];
    let status: AgentRunResult['status'] = 'RUNNING';

    for (let i = 0; i < 8; i += 1) {
      const result = await provider.complete({
        system,
        messages: [...messages, ...(outputs.length ? [] : [])].slice(-24),
        tools: allowed.map(toLlmToolDef),
      });

      if (!result.toolCall) {
        messages.push({ role: 'assistant', content: result.text ?? '' });
        status = 'COMPLETED';
        break;
      }

      const outcome = await this.runner.run(orgId, userId, result.toolCall.name, result.toolCall.input, {
        source: 'AGENT',
        why: `Agent ${agent.name}: ${prompt}`,
      });

      if (outcome.status === 'requires_approval') {
        approvals.push(outcome.approvalId);
        messages.push({
          role: 'assistant',
          content: `The tool ${result.toolCall.name} requires human approval (request ${outcome.approvalId}). State that it is awaiting approval.`,
        });
        continue;
      }
      if (outcome.status === 'denied_permission') {
        messages.push({ role: 'assistant', content: `${result.toolCall.name} was not permitted for this member. Skip it.` });
        continue;
      }

      outputs.push(outcome.result);
      messages.push({ role: 'user', content: `[TOOL_RESULT] ${JSON.stringify(outcome.result)}` });
    }

    const finalStatus: AgentRunResult['status'] = approvals.length ? 'NEEDS_APPROVAL' : status;
    await this.prisma.withTenant(orgId, (tx) =>
      tx.aiAgentRun.update({
        where: { id: run.id },
        data: {
          status: finalStatus,
          approvalId: approvals[0],
          output: { steps: outputs, approvalCount: approvals.length } as never,
          completedAt: new Date(),
        },
      }),
    );
    await this.audit.record(orgId, 'EXECUTE', 'ai.agent', run.id, {
      actorId: userId, meta: { status: finalStatus, approvals: approvals.length },
    });

    return { runId: run.id, agent: agent.key, status: finalStatus, output: outputs, approvals };
  }

  async runs(orgId: string, agentKey?: string) {
    return this.prisma.withTenant(orgId, (tx) =>
      tx.aiAgentRun.findMany({ where: { orgId, ...(agentKey ? { agentKey } : {}) }, orderBy: { startedAt: 'desc' }, take: 50 }),
    );
  }
}