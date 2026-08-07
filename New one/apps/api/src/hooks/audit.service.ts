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
}
