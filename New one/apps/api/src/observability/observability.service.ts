import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Observability — persists structured errors (ErrorRecord) and metric counters
 * (MetricEvent) to the DB, tenant-scoped where an org is known. `snapshot()`
 * aggregates for the admin health dashboard.
 */
@Injectable()
export class ObservabilityService {
  constructor(private readonly prisma: PrismaService) {}

  /** Record an error (copy of the exception shape). */
  async recordError(input: {
    orgId?: string; code: string; statusCode: number; requestMethod?: string; requestUrl?: string; message: string; stack?: string;
  }): Promise<void> {
    if (!input.orgId) return; // errors without a tenant claim aren't attributed to an org
    await this.prisma.withTenant(input.orgId, (tx) =>
      tx.errorRecord.create({ data: { orgId: input.orgId, ...input } }),
    );
  }

  /** Increment a counter (append-only MetricEvent). */
  async inc(orgId: string, name: string, value = 1): Promise<void> {
    await this.prisma.withTenant(orgId, (tx) => tx.metricEvent.create({ data: { orgId, name, value } }));
  }

  async snapshot(orgId: string) {
    const uptime = process.uptime();
    const db = await this.dbUp(orgId);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.prisma.withTenant(orgId, async (tx) => {
      const [errorCount, metricGroups, executionStats, recentErrors, recentMetrics] = await Promise.all([
        tx.errorRecord.count({ where: { orgId, createdAt: { gte: since } } }),
        tx.metricEvent.groupBy({ by: ['name'], where: { orgId }, _sum: { value: true } }),
        tx.workflowExecution.groupBy({ by: ['status'], where: { orgId }, _count: true }),
        tx.errorRecord.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' }, take: 10 }),
        tx.metricEvent.findMany({ where: { orgId, createdAt: { gte: since } }, orderBy: { createdAt: 'desc' }, take: 25 }),
      ]);

      const counters: Record<string, number> = {};
      for (const g of metricGroups) counters[g.name] = Number(g._sum.value ?? 0);
      const executions: Record<string, number> = {};
      for (const s of executionStats) executions[s.status] = s._count;

      return {
        db: db ? 'up' : 'down',
        uptimeSeconds: Math.floor(uptime),
        counters,
        executions,
        errorCount24h: errorCount,
        recentErrors: recentErrors.slice(0, 10),
        recentMetrics: recentMetrics,
      };
    });
  }

  private async dbUp(orgId: string): Promise<boolean> {
    try {
      await this.prisma.withTenant(orgId, (tx) => tx.$queryRaw`SELECT 1`);
      return true;
    } catch {
      return false;
    }
  }

  async errors(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.errorRecord.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' }, take: 50 }));
  }

  async metrics(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) =>
      tx.metricEvent.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' }, take: 200 }),
    );
  }
}