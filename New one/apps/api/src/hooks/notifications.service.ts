import { Injectable } from '@nestjs/common';
import { NotificationType } from '@nexus/shared';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Minimal, real notification hook (Value the Base). Persists tenant-scoped
 * Notification rows; later phases add in-app routing, channels, and preferences.
 */
@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async notify(
    orgId: string,
    opts: { userId?: string; type: NotificationType; title: string; body?: string },
  ): Promise<void> {
    await this.prisma.withTenant(orgId, (tx) =>
      tx.notification.create({ data: { orgId, userId: opts.userId, type: opts.type, title: opts.title, body: opts.body } }),
    );
  }
}