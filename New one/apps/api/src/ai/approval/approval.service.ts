import { Injectable } from '@nestjs/common';
import { AiApprovalStatus, AiApprovalSource, AiMessageRole } from '@nexus/shared';
import { ApiException } from '../../common/exceptions';
import { AuditService } from '../../hooks/audit.service';
import { NotificationsService } from '../../hooks/notifications.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RbacService } from '../../rbac/rbac.service';
import { ToolRunner } from '../tools/tool.runner';
import type { AiToolResult } from '../tools/tool.types';

export interface CreateApprovalInput {
  orgId: string;
  source: AiApprovalSource;
  targetKey: string;
  summary: Record<string, unknown>;
  input?: Record<string, unknown>;
  requestedById?: string;
  approvableBy?: string;
  expiresAt: Date;
}

export interface DecideResult {
  approval: { id: string; status: AiApprovalStatus; decision: string | null };
  /** Set when an approval actually executed the sensitive action. */
  executedResult?: AiToolResult;
}

/**
 * AI Approval System — REAL human-in-the-loop.
 *
 *   sensitive action → approval request → notify → APPROVE/REJECT/EDIT.
 *   approve/edit ⇒ ToolRunner.executeApproved (the ONLY sensitive-execution path).
 *   deny ⇒ aborts. Unresolved/orphaned approvals auto-deny (escalation) on any
 *   list/decide pass — recorded + audited as EXPIRED.
 */
@Injectable()
export class ApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
    private readonly runner: ToolRunner,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(input: CreateApprovalInput) {
    return this.prisma.withTenant(input.orgId, (tx) =>
      tx.aiApprovalRequest.create({
        data: {
          orgId: input.orgId,
          source: input.source,
          status: 'PENDING',
          targetKey: input.targetKey,
          summary: input.summary as never,
          input: (input.input as never) ?? undefined,
          requestedById: input.requestedById,
          approvableBy: input.approvableBy,
          expiresAt: input.expiresAt,
        },
      }),
    );
  }

  /** Pending + recent approvals; expires orphans first. `userId` may limit routing. */
  async list(orgId: string, userId?: string) {
    await this.expirePending(orgId);
    return this.prisma.withTenant(orgId, (tx) =>
      tx.aiApprovalRequest.findMany({
        where: { orgId, ...(userId ? { OR: [{ approvableBy: userId }, { approvableBy: null }] } : {}) },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        take: 100,
      }),
    );
  }

  /** Auto-deny PENDING approvals older than the TTL (escalation). Idempotent. */
  async expirePending(orgId: string, ttlMs = 24 * 60 * 60 * 1000): Promise<number> {
    const cutoff = new Date(Date.now() - ttlMs);
    const stale = await this.prisma.withTenant(orgId, (tx) =>
      tx.aiApprovalRequest.findMany({
        where: { orgId, status: 'PENDING', createdAt: { lte: cutoff } },
        select: { id: true },
      }),
    );
    if (stale.length === 0) return 0;
    await this.prisma.withTenant(orgId, (tx) =>
      tx.aiApprovalRequest.updateMany({
        where: { id: { in: stale.map((s) => s.id) } },
        data: { status: 'EXPIRED', decision: 'DENIED', escalatedAt: new Date(), escalationReason: 'TIMEOUT_ORPHANED' },
      }),
    );
    for (const s of stale) {
      await this.audit.record(orgId, 'REJECT', 'ai.approval', s.id, { meta: { reason: 'TIMEOUT_ORPHANED' } });
    }
    return stale.length;
  }

  /** Approve / reject / edit. Approving (or editing then approving) executes. */
  async decide(
    orgId: string,
    approvalId: string,
    action: 'approve' | 'deny' | 'edit',
    actorId: string,
    editedInput?: Record<string, unknown>,
  ): Promise<DecideResult> {
    const perms = await this.rbac.getEffectivePermissions(orgId, actorId);
    if (!perms.includes('ai.approval.decide')) {
      throw new ApiException('FORBIDDEN', { message: 'Missing ai.approval.decide' });
    }

    await this.expirePending(orgId);

    const approval = await this.prisma.withTenant(orgId, (tx) =>
      tx.aiApprovalRequest.findFirst({ where: { id: approvalId, orgId } }),
    );
    if (!approval) throw new ApiException('NOT_FOUND');
    if (approval.status !== 'PENDING') {
      throw new ApiException('CONFLICT', { message: `Approval already ${approval.status.toLowerCase()}` });
    }

    let nextStatus: AiApprovalStatus;
    let decision: string | null;

    if (action === 'deny') {
      nextStatus = 'DENIED';
      decision = 'DENIED';
    } else if (action === 'edit') {
      // EDIT alone does not finalize; this keeps the request pending with the
      // proposed edit so the UI can review. decide('approve') applies it.
      const stored = editedInput ? (editedInput as never) : undefined;
      await this.prisma.withTenant(orgId, (tx) =>
        tx.aiApprovalRequest.update({ where: { id: approval.id }, data: { editInput: stored } }),
      );
      await this.audit.record(orgId, 'UPDATE', 'ai.approval', approval.id, { actorId, meta: { action: 'edit', editInput: editedInput } });
      return { approval: { id: approval.id, status: 'PENDING', decision: null } };
    } else {
      nextStatus = approval.editInput ? 'EDITED' : 'APPROVED';
      decision = nextStatus;
    }

    const decided = await this.prisma.withTenant(orgId, (tx) =>
      tx.aiApprovalRequest.update({
        where: { id: approval.id },
        data: { status: nextStatus, decision, decidedById: actorId, decidedAt: new Date() },
      }),
    );

    await this.audit.record(orgId, nextStatus === 'APPROVED' || nextStatus === 'EDITED' ? 'APPROVE' : 'REJECT', 'ai.approval', approval.id, {
      actorId,
      meta: { tool: approval.targetKey, decision, editInput: approval.editInput },
    });
    await this.notifications.notify(orgId, {
      type: nextStatus === 'APPROVED' || nextStatus === 'EDITED' ? 'SUCCESS' : 'ERROR',
      title: `AI approval ${nextStatus.toLowerCase()}`,
      body: `${approval.targetKey} was ${nextStatus.toLowerCase()}${decision === 'DENIED' ? '' : ' and executed'}.`,
    });

    // The sensitive action executes only here, behind a persisted approval.
    let executedResult: AiToolResult | undefined;
    if (nextStatus === 'APPROVED' || nextStatus === 'EDITED') {
      executedResult = await this.runner.executeApproved(orgId, approval.id, actorId);
    }
    return { approval: decided, executedResult };
  }

  /** Detail of a single approval (incl. its executed result). */
  async get(orgId: string, approvalId: string) {
    await this.expirePending(orgId);
    return this.prisma.withTenant(orgId, (tx) =>
      tx.aiApprovalRequest.findFirst({ where: { id: approvalId, orgId } }),
    );
  }
}
