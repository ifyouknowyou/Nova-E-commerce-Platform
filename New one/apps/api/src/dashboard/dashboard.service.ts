import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Pure forecast: clearly separates actual / projected / estimated (real data). */
export function forecastPipeline(openValue: number, weightedValue: number, wonValue: number) {
  return {
    actual: round2(wonValue), // closed-won revenue
    projected: round2(weightedValue), // open deals × probability
    estimated: round2(openValue + wonValue), // full pipeline (gross open + won)
  };
}

/** Map[YYYY-MM] → sum over dated amount rows. */
export function groupByMonth(rows: { date: Date; amount: string | number }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const key = r.date.toISOString().slice(0, 7);
    out[key] = round2((out[key] ?? 0) + Number(r.amount));
  }
  return out;
}

function groupByCategory(rows: { category: string | null; amount: string | number }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const key = r.category ?? 'Uncategorized';
    out[key] = round2((out[key] ?? 0) + Number(r.amount));
  }
  return out;
}

/**
 * Executive dashboard + BI — answers WHAT HAPPENED / IS HAPPENING / NEEDS
 * ATTENTION from live tenant data. No fabricated numbers; the forecast keeps
 * actual / projected / estimated explicit.
 */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async kpis(orgId: string) {
    return this.prisma.withTenant(orgId, async (tx) => {
      const [
        paymentAgg,
        expenseAgg,
        contactCount,
        companyCount,
        openDeals,
        wonDeals,
        openLeads,
        outstandingInvoices,
        activeProjects,
        openTasks,
        recentPayments,
      ] = await Promise.all([
        tx.payment.aggregate({ where: { orgId }, _sum: { amount: true } }),
        tx.expense.aggregate({ where: { orgId }, _sum: { amount: true } }),
        tx.contact.count({ where: { orgId } }),
        tx.company.count({ where: { orgId } }),
        tx.deal.findMany({ where: { orgId, stage: { notIn: ['WON', 'LOST'] } }, select: { value: true, probability: true } }),
        tx.deal.findMany({ where: { orgId, stage: 'WON' }, select: { value: true } }),
        tx.lead.count({ where: { orgId, status: { notIn: ['WON', 'LOST'] } } }),
        tx.invoice.findMany({ where: { orgId, status: { in: ['SENT', 'PARTIALLY_PAID'] } }, select: { total: true, paidAmount: true } }),
        tx.project.count({ where: { orgId, status: { notIn: ['COMPLETED', 'ARCHIVED'] } } }),
        tx.task.count({ where: { orgId, status: { notIn: ['DONE'] } } }),
        tx.payment.findMany({ where: { orgId }, orderBy: { date: 'desc' }, take: 5 }),
      ]);

      const revenue = round2(Number(paymentAgg._sum.amount ?? 0));
      const expenses = round2(Number(expenseAgg._sum.amount ?? 0));
      const openValue = openDeals.reduce((s, d) => s + Number(d.value), 0);
      const weighted = openDeals.reduce((s, d) => s + Number(d.value) * (d.probability / 100), 0);
      const wonValue = wonDeals.reduce((s, d) => s + Number(d.value), 0);
      const outstanding = round2(
        outstandingInvoices.reduce((s, e) => s + Math.max(0, Number(e.total) - Number(e.paidAmount)), 0),
      );

      return {
        revenue,
        expenses,
        profit: round2(revenue - expenses),
        companies: companyCount,
        contacts: contactCount,
        openLeads,
        openDeals: openDeals.length,
        pipelineValue: round2(openValue),
        wonValue: round2(wonValue),
        outstanding,
        activeProjects,
        openTasks,
        forecast: forecastPipeline(openValue, weighted, wonValue),
        recentPayments: recentPayments.map((p) => ({ date: p.date, amount: Number(p.amount) })),
      };
    });
  }

  async bi(orgId: string) {
    return this.prisma.withTenant(orgId, async (tx) => {
      const [revenueRows, expenseRows, dealsByStage, leadsByStatus] = await Promise.all([
        tx.payment.findMany({ where: { orgId }, select: { date: true, amount: true } }),
        tx.expense.findMany({ where: { orgId }, select: { date: true, amount: true, category: true } }),
        tx.deal.groupBy({ by: ['stage'], where: { orgId }, _sum: { value: true }, _count: true }),
        tx.lead.groupBy({ by: ['status'], where: { orgId }, _count: true }),
      ]);
      return {
        revenueByMonth: groupByMonth(revenueRows as never),
        expensesByMonth: groupByMonth(expenseRows as never),
        expensesByCategory: groupByCategory(expenseRows as never),
        dealsByStage: dealsByStage.map((d) => ({ stage: d.stage, count: d._count, value: round2(Number(d._sum.value ?? 0)) })),
        leadsByStatus: leadsByStatus.map((l) => ({ status: l.status, count: l._count })),
      };
    });
  }
}