import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../hooks/notifications.service';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { evaluateConditions, Condition } from './conditions';

export interface ActionSpec {
  type: 'TASK' | 'NOTIFY' | 'ASSIGN' | 'EMAIL' | 'WEBHOOK' | 'UPDATE_RECORD';
  [k: string]: unknown;
}

export interface Workflow {
  id: string;
  orgId: string;
  name: string;
  enabled: boolean;
  triggerType: string;
  conditions: Condition[];
  actions: ActionSpec[];
}

// Structural subset of the tenant transaction client the runner writes through.
type TxLike = {
  task: { create(a: Record<string, unknown>): Promise<{ id: string }>; update(a: Record<string, unknown>): Promise<unknown> };
  ticket: { updateMany(a: Record<string, unknown>): Promise<{ count: number }>; update(a: Record<string, unknown>): Promise<unknown> };
  deal: { update(a: Record<string, unknown>): Promise<unknown> };
};

/**
 * WorkflowRunner — executes a workflow's actions inside the org's tenant RLS
 * context (each action writes through the prisma tx the dispatcher opened).
 * Real side effects: DB writes, notifications, mail, webhooks — never mocks.
 */
@Injectable()
export class WorkflowRunner {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly mail: MailService,
  ) {}

  async run(workflow: Workflow, context: Record<string, unknown>): Promise<{ ok: boolean; summary: unknown[]; error?: string }> {
    if (!evaluateConditions(workflow.conditions, context)) {
      return { ok: true, summary: [{ skipped: 'conditions not met' }] };
    }
    const results: unknown[] = [];
    try {
      await this.prisma.withTenant(workflow.orgId, async (tx) => {
        const txLike = tx as unknown as TxLike;
        for (const action of workflow.actions) {
          results.push(await this.executeAction(txLike, action, context));
        }
      });
      return { ok: true, summary: results };
    } catch (e) {
      return { ok: false, summary: results, error: e instanceof Error ? e.message : String(e) };
    }
  }

  private async executeAction(tx: TxLike, action: ActionSpec, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    const orgId = context.orgId as string;

    switch (action.type) {
      case 'TASK': {
        const created = await tx.task.create({
          data: { orgId, title: String(action.title ?? 'Auto task'), status: 'TODO', projectId: (action.projectId as string) ?? undefined },
        });
        return { action: 'TASK', taskId: created.id };
      }
      case 'NOTIFY': {
        await this.notifications.notify(orgId, {
          userId: action.userId as string | undefined,
          type: 'INFO',
          title: String(action.title ?? 'Notice'),
          body: String(action.body ?? ''),
        });
        return { action: 'NOTIFY' };
      }
      case 'ASSIGN': {
        // Assign a ticket by id (or by subject match) to an assignee.
        await tx.ticket.updateMany({ where: { id: action.ticketId as string }, data: { assignedToId: action.assigneeId as string | null } });
        return { action: 'ASSIGN' };
      }
      case 'EMAIL': {
        await this.mail.send({ to: String(action.to ?? ''), subject: String(action.subject ?? ''), text: String(action.body ?? '') });
        return { action: 'EMAIL' };
      }
      case 'WEBHOOK': {
        const url = String(action.url ?? '');
        const resp = await fetch(url, {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(context), signal: AbortSignal.timeout(5000),
        });
        return { action: 'WEBHOOK', status: resp.status };
      }
      case 'UPDATE_RECORD': {
        // Allow-list of safe updates: e.g. { model:'task', recordId, data:{status} }.
        const model = action.model as string;
        const id = action.recordId as string;
        const data = (action.data ?? {}) as Record<string, unknown>;
        if (model === 'task') await tx.task.update({ where: { id }, data: data as never });
        if (model === 'ticket') await tx.ticket.update({ where: { id }, data: data as never });
        if (model === 'deal') await tx.deal.update({ where: { id }, data: data as never });
        return { action: 'UPDATE_RECORD', model };
      }
      default:
        throw new Error(`unknown action type: ${action.type}`);
    }
  }
}