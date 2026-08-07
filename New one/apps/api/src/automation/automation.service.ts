import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/exceptions';
import { WorkflowTriggerType } from './types';

@Injectable()
export class AutomationService {
  constructor(private readonly prisma: PrismaService) {}

  async list(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.workflow.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } }));
  }

  async create(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) =>
      tx.workflow.create({
        data: {
          orgId,
          name: String(data.name ?? 'Untitled workflow'),
          description: (data.description as string) ?? null,
          triggerType: (data.triggerType as WorkflowTriggerType) ?? 'RECORD_CREATED',
          triggerConfig: (data.triggerConfig ?? {}) as never,
          conditions: (data.conditions ?? []) as never,
          actions: (data.actions ?? []) as never,
        },
      }),
    );
  }

  async update(orgId: string, id: string, data: Record<string, unknown>) {
    const wf = await this.prisma.withTenant(orgId, (tx) => tx.workflow.findFirst({ where: { id, orgId } }));
    if (!wf) throw new ApiException('NOT_FOUND');
    return this.prisma.withTenant(orgId, (tx) =>
      tx.workflow.update({
        where: { id },
        data: {
          ...(data.name !== undefined ? { name: data.name as string } : {}),
          ...(data.description !== undefined ? { description: data.description as string } : {}),
          ...(data.enabled !== undefined ? { enabled: data.enabled as boolean } : {}),
          ...(data.conditions !== undefined ? { conditions: data.conditions as never } : {}),
          ...(data.actions !== undefined ? { actions: data.actions as never } : {}),
        },
      }),
    );
  }

  async remove(orgId: string, id: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.workflow.deleteMany({ where: { id, orgId } }));
  }

  async executions(orgId: string, take = 100) {
    return this.prisma.withTenant(orgId, (tx) =>
      tx.workflowExecution.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' }, take }),
    );
  }
}