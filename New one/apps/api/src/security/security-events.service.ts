import { Injectable } from '@nestjs/common';
import { SecurityEventType } from '@nexus/shared';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Records security events (login history + security signals) — tenant-scoped,
 * written via withTenant so RLS accepts the insert, and read back scoped.
 */
@Injectable()
export class SecurityEventsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Record an event for an org (optionally tied to a user). */
  async record(
    orgId: string,
    type: SecurityEventType,
    opts: { userId?: string; ip?: string; userAgent?: string; meta?: Record<string, unknown> } = {},
  ): Promise<void> {
    await this.prisma.withTenant(orgId, (tx) =>
      tx.securityEvent.create({
        data: { orgId, userId: opts.userId, type, ip: opts.ip, userAgent: opts.userAgent, meta: opts.meta as never },
      }),
    );
  }

  /** Paginated, tenant-scoped event feed (login history). */
  async list(orgId: string, userId?: string, take = 50): Promise<unknown[]> {
    return this.prisma.withTenant(orgId, (tx) =>
      tx.securityEvent.findMany({
        where: { orgId, ...(userId ? { userId } : {}) },
        orderBy: { createdAt: 'desc' },
        take,
      }),
    );
  }
}
