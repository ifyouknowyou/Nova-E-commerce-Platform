import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WorkflowRunner, Workflow } from './workflow.runner';
import { WorkflowTriggerType, WorkflowExecutionStatus } from './types';

/**
 * WorkflowDispatcher — the event bus. Modules call `emit(orgId, triggerType,
 * context)` after a domain event; the dispatcher finds all enabled workflows
 * matching the trigger, runs each via WorkflowRunner, and appends a
 * WorkflowExecution row (every run is logged).
 */
@Injectable()
export class WorkflowDispatcher {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runner: WorkflowRunner,
  ) {}

  async emit(orgId: string, triggerType: WorkflowTriggerType, context: Record<string, unknown>): Promise<void> {
    const workflows = await this.prisma.withTenant(orgId, (tx) =>
      tx.workflow.findMany({ where: { orgId, enabled: true, triggerType } }),
    );
    if (!workflows.length) return;

    const ctx = { ...context, orgId };
    for (const wf of workflows) {
      const workflow: Workflow = {
        id: wf.id, orgId: wf.orgId, name: wf.name, enabled: wf.enabled,
        triggerType: wf.triggerType, conditions: wf.conditions as never, actions: wf.actions as never,
      };
      const result = await this.runner.run(workflow, ctx);

      const status: WorkflowExecutionStatus = result.ok ? 'SUCCESS' : 'FAILED';
      await this.prisma.withTenant(orgId, (tx) =>
        tx.workflowExecution.create({
          data: {
            orgId, workflowId: wf.id, status, triggerType,
            summary: (result.summary ?? []) as never, error: result.error,
            triggeredById: context.actorId as string | undefined,
          },
        }),
      );
    }
  }
}