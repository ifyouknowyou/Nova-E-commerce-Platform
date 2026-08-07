import { Injectable } from '@nestjs/common';
import { AiMessageRole, AiToolRisk } from '@nexus/shared';
import { ApiException } from '../../common/exceptions';
import { AuditService } from '../../hooks/audit.service';
import { NotificationsService } from '../../hooks/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RbacService } from '../../rbac/rbac.service';
import { AiToolCallLog, AiApprovalRequest } from '@prisma/client';
import type { AiToolContext, AiToolOutcome, AiToolResult } from './tool.types';
import { ToolRegistry } from './tool.registry';

export interface RunToolOpts {
  conversationId?: string;
  source: AiMessageRole; // USER | AGENT
  /** Human-readable WHY for the approval (what the user asked). */
  why?: string;
}

/**
 * The ONE execution pipeline for every AI tool call. The spec's chain:
 *   INTENT → PERMISSION CHECK → RISK CHECK → TOOL → RESULT → AUDIT LOG.
 *
 * HIGH/SENSITIVE tools NEVER run here: the runner creates an AiApprovalRequest
 * and returns requires_approval. The only code path that invokes a sensitive
 * handler is executeApproved(), which requires a persisted APPROVED/EDITED
 * approval. All invocations are logged (ai_tool_call_logs) + audited.
 */
@Injectable()
export class ToolRunner {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
    private readonly registry: ToolRegistry,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Permission-gated + risk-gated tool invocation (no sensitive execution). */
  async run(
    orgId: string,
    actorId: string,
    toolName: string,
    input: Record<string, unknown>,
    opts: RunToolOpts,
  ): Promise<AiToolOutcome> {
    const tool = this.registry.get(toolName);
    if (!tool) throw new ApiException('NOT_FOUND', { message: `Unknown AI tool: ${toolName}` });

    const perms = await this.rbac.getEffectivePermissions(orgId, actorId);
    if (!perms.includes(tool.permission)) {
      await this.logCall(orgId, actorId, opts, toolName, input, tool.risk, 'ABORTED');
      return { status: 'denied_permission' };
    }

    const ctx: AiToolContext = { orgId, actorId };

    // READ / LOW execute directly.
    if (tool.risk === 'READ' || tool.risk === 'LOW') {
      const result = await tool.handler(ctx, input);
      await this.logCall(orgId, actorId, opts, toolName, input, tool.risk, 'EXECUTED', { result });
      await this.audit.record(orgId, 'EXECUTE', 'ai.tool', toolName, {
        actorId, meta: { risk: tool.risk, input },
      });
      return { status: 'executed', result };
    }

    // HIGH / SENSITIVE → approval request, never execute.
    const approval = await this.createApproval(orgId, actorId, opts, toolName, input, tool.risk);
    await this.logCall(orgId, actorId, opts, toolName, input, tool.risk, 'NEEDS_APPROVAL', { approvalId: approval.id });
    await this.audit.record(orgId, 'EXECUTE', 'ai.approval', approval.id, {
      actorId, meta: { tool: toolName, stage: 'awaiting_approval', input },
    });
    return { status: 'requires_approval', approvalId: approval.id };
  }

  /**
   * Execute a sensitive tool AFTER a persisted approval. This is the ONLY path
   * a HIGH/SENSITIVE handler runs. Fails closed unless the approval is
   * APPROVED (or EDITED, using the edited input).
   */
  async executeApproved(orgId: string, approvalId: string, actorId?: string): Promise<AiToolResult> {
    const approval = await this.prisma.withTenant(orgId, async (tx) =>
      tx.aiApprovalRequest.findFirst({ where: { id: approvalId, orgId } }),
    );
    if (!approval) throw new ApiException('NOT_FOUND', { message: 'Approval request not found' });
    if (approval.status !== 'APPROVED' && approval.status !== 'EDITED') {
      throw new ApiException('FORBIDDEN', { message: `Cannot execute: approval is ${approval.status}` });
    }

    const tool = this.registry.get(approval.targetKey);
    if (!tool) throw new ApiException('NOT_FOUND', { message: `Unknown AI tool: ${approval.targetKey}` });

    const input = (approval.editInput ?? approval.input ?? {}) as Record<string, unknown>;
    const result = await tool.handler({ orgId, actorId: actorId ?? approval.requestedById ?? undefined }, input);

    await this.prisma.withTenant(orgId, (tx) =>
      tx.aiApprovalRequest.update({ where: { id: approval.id }, data: { result: result as never } }),
    );
    await this.logCall(orgId, actorId, { source: 'AGENT' }, approval.targetKey, input, tool.risk, 'APPROVED', { result, approvalId });
    await this.audit.record(orgId, 'EXECUTE', 'ai.tool', approval.targetKey, {
      actorId, meta: { risk: tool.risk, input, approvedBy: approval.decidedById },
    });
    return result;
  }

  // ── helpers ─────────────────────────────────────────────────────────────────
  private async createApproval(
    orgId: string,
    actorId: string,
    opts: RunToolOpts,
    toolName: string,
    input: Record<string, unknown>,
    risk: AiToolRisk,
  ): Promise<AiApprovalRequest> {
    const tool = this.registry.get(toolName);
    const summary = {
      description: tool?.description ?? toolName,
      why: opts.why ?? 'Requested via the AI copilot / agent.',
      dataAffected: `${toolName} → ${JSON.stringify(input)}`,
      expectedResult: tool ? `${toolName} executes with the supplied input.` : toolName,
      risk,
    };
    const ttl = 24 * 60 * 60 * 1000; // config-driven via ApprovalService later; matches AI_APPROVAL_TTL_MS default
    const approval = await this.prisma.withTenant(orgId, (tx) =>
      tx.aiApprovalRequest.create({
        data: {
          orgId,
          source: opts.source === 'AGENT' ? 'AGENT_RUN' : 'TOOL_CALL',
          status: 'PENDING',
          targetKey: toolName,
          summary: summary as never,
          input: input as never,
          requestedById: actorId,
          expiresAt: new Date(Date.now() + ttl),
        },
      }),
    );
    await this.notifications.notify(orgId, {
      type: 'WARNING',
      title: `AI action needs approval: ${toolName}`,
      body: `${summary.why} ${summary.description}`,
    });
    return approval;
  }

  private async logCall(
    orgId: string,
    actorId: string | undefined,
    opts: RunToolOpts,
    toolName: string,
    input: Record<string, unknown>,
    risk: AiToolRisk,
    status: AiToolCallLog['status'],
    extra: { result?: AiToolResult; approvalId?: string } = {},
  ): Promise<void> {
    await this.prisma.withTenant(orgId, (tx) =>
      tx.aiToolCallLog.create({
        data: {
          orgId,
          conversationId: opts.conversationId,
          source: opts.source,
          toolName,
          risk,
          status,
          input: input as never,
          result: (extra.result as never) ?? undefined,
          actorId,
          approvalId: extra.approvalId,
        },
      }),
    );
  }
}
