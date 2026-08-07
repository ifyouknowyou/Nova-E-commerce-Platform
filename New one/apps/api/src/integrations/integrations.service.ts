import { Injectable } from '@nestjs/common';
import { IntegrationProvider, IntegrationStatus } from '@nexus/shared';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityEventsService } from '../security/security-events.service';

export interface CreateIntegrationInput {
  provider: IntegrationProvider;
  name: string;
  config: Record<string, unknown>;
}

/**
 * Connector registry (Phase 5 automation engine plugs in here). Real, working
 * integration points only: WEBHOOK performs an actual HTTP ping on `test`.
 */
@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: SecurityEventsService,
  ) {}

  async list(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.integration.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } }));
  }

  async create(orgId: string, input: CreateIntegrationInput) {
    const url = String(input.config?.url ?? '');
    if (!/^https?:\/\//i.test(url)) throw new Error('config.url must be an http(s) URL');

    return this.prisma.withTenant(orgId, (tx) =>
      tx.integration.create({
        data: {
          orgId,
          provider: input.provider,
          name: input.name,
          config: input.config as never,
          status: 'DISCONNECTED',
          enabled: true,
        },
      }),
    );
  }

  async update(orgId: string, id: string, input: Partial<CreateIntegrationInput>) {
    const existing = await this.prisma.withTenant(orgId, (tx) =>
      tx.integration.findFirst({ where: { id, orgId } }),
    );
    if (!existing) return null;
    return this.prisma.withTenant(orgId, (tx) =>
      tx.integration.update({
        where: { id },
        data: {
          ...(input.name ? { name: input.name } : {}),
          ...(input.config ? { config: input.config as never } : {}),
        },
      }),
    );
  }

  async remove(orgId: string, id: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.integration.deleteMany({ where: { id, orgId } }));
  }

  /** Perform a REAL webhook ping to the configured URL. */
  async test(orgId: string, id: string, userId: string): Promise<{ ok: boolean; status: number; statusText: string }> {
    const integration = await this.prisma.withTenant(orgId, (tx) =>
      tx.integration.findFirst({ where: { id, orgId } }),
    );
    if (!integration) return { ok: false, status: 0, statusText: 'not found' };

    const url = String((integration.config as { url?: unknown })?.url ?? '');
    let res: { ok: boolean; status: number; statusText: string };
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-nexus-integration': integration.id },
        body: JSON.stringify({ event: 'test', at: new Date().toISOString() }),
        signal: AbortSignal.timeout(8000),
      });
      res = { ok: resp.ok, status: resp.status, statusText: resp.statusText };
    } catch {
      res = { ok: false, status: 0, statusText: 'network error' };
    }

    const status: IntegrationStatus = res.ok ? 'CONNECTED' : 'ERROR';
    await this.prisma.withTenant(orgId, (tx) =>
      tx.integration.update({ where: { id }, data: { status, lastTestedAt: new Date() } }),
    );
    await this.events.record(orgId, 'INTEGRATION_TESTED', { userId, meta: { integrationId: id, ok: res.ok, status: res.status } });
    return res;
  }
}