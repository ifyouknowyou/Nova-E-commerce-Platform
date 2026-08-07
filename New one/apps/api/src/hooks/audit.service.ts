import { Injectable } from '@nestjs/common';
import { AuditAction } from '@nexus/shared';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Minimal, real audit hook (Value the Base). Persists tenant-scoped AuditLog
 * rows; later modules/automation build richer queries on it.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    orgId: string,
    action: AuditAction,
    entity: string,
    entityId: string,
    opts: { actorId?: string; meta?: Record<string, unknown>; ip?: string; userAgent?: string } = {},
  ): Promise<void> {
    await this.prisma.withTenant(orgId, (tx) =>
      tx.auditLog.create({
        data: {
          orgId,
          actorId: opts.actorId,
          action,
          entity,
          entityId,
          meta: opts.meta as never,
          ip: opts.ip,
          userAgent: opts.userAgent,
        },
      }),
    );
  }

  /** Query the tenant audit trail (read-only; no delete — not casually editable). */
  async list(
    orgId: string,
    opts: { page?: number; pageSize?: number; entity?: string; action?: string; actorId?: string } = {},
  ): Promise<{ items: unknown[]; total: number; page: number; pageSize: number }> {
    const page = opts.page ?? 1;
    const pageSize = Math.min(100, opts.pageSize ?? 50);
    const where = {
      orgId,
      ...(opts.entity ? { entity: opts.entity } : {}),
      ...(opts.action ? { action: opts.action } : {}),
      ...(opts.actorId ? { actorId: opts.actorId } : {}),
    };
    return this.prisma.withTenant(orgId, async (tx) => {
      const [items, total] = await Promise.all([
        tx.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
        tx.auditLog.count({ where }),
      ]);
      return { items, total, page, pageSize };
    });
  }
}
