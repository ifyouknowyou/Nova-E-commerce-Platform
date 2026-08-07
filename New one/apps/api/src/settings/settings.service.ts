import { Injectable } from '@nestjs/common';
import { withUserContext } from '@nexus/db';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Org settings as a flat key→value map. */
  async org(orgId: string): Promise<Record<string, unknown>> {
    const rows = await this.prisma.withTenant(orgId, (tx) =>
      tx.setting.findMany({ where: { orgId }, select: { key: true, value: true } }),
    );
    const out: Record<string, unknown> = {};
    for (const r of rows) out[r.key] = r.value;
    return out;
  }

  /** Upsert org settings key/value pairs. */
  async updateOrg(orgId: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    const keys = Object.keys(body);
    for (const key of keys) {
      await this.prisma.withTenant(orgId, (tx) =>
        tx.setting.upsert({
          where: { orgId_key: { orgId, key } },
          update: { value: body[key] as never },
          create: { orgId, key, value: body[key] as never },
        }),
      );
    }
    return this.org(orgId);
  }

  /** Personal preferences as a flat key→value map (user-scoped). */
  async me(userId: string): Promise<Record<string, unknown>> {
    const rows = await withUserContext(userId, (tx) =>
      tx.userPreference.findMany({ where: { userId }, select: { key: true, value: true } }),
    );
    const out: Record<string, unknown> = {};
    for (const r of rows) out[r.key] = r.value;
    return out;
  }

  async updateMe(userId: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    for (const key of Object.keys(body)) {
      await withUserContext(userId, (tx) =>
        tx.userPreference.upsert({
          where: { userId_key: { userId, key } },
          update: { value: body[key] as never },
          create: { userId, key, value: body[key] as never },
        }),
      );
    }
    return this.me(userId);
  }
}
