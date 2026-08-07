import { Injectable } from '@nestjs/common';
import { QuoteStatus } from '@nexus/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/exceptions';

interface QuoteLine {
  productId?: string;
  description: string;
  qty: number;
  unitPrice: number;
}

/** Total-computation is pure and unit-testable. */
export function computeTotals(lines: QuoteLine[], taxRate = 0): { subtotal: number; tax: number; total: number } {
  const subtotal = lines.reduce((sum, l) => sum + (l.qty ?? 1) * (l.unitPrice ?? 0), 0);
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  return { subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100 };
}

/**
 * Sales — products, quotes (server-computed totals) + send, sales targets.
 * Tenant-scoped via withTenant on every call.
 */
@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Products --------------------------------------------------------------
  async products(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.product.findMany({ where: { orgId }, orderBy: { name: 'asc' } }));
  }

  async createProduct(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.product.create({ data: { ...data, orgId } as never }));
  }

  // ---- Quotes ----------------------------------------------------------------
  async quotes(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.quote.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } }));
  }

  async quoteDetail(orgId: string, id: string) {
    const quote = await this.prisma.withTenant(orgId, (tx) => tx.quote.findFirst({ where: { id, orgId } }));
    if (!quote) throw new ApiException('NOT_FOUND');
    const items = await this.prisma.withTenant(orgId, (tx) => tx.quoteItem.findMany({ where: { quoteId: id } }));
    return { ...quote, items };
  }

  /** Create a quote from its line items; totals are computed server-side. */
  async createQuote(orgId: string, issuedById: string | undefined, input: {
    number: string; contactId?: string; companyId?: string; validUntil?: string; taxRate?: number; items: QuoteLine[];
  }) {
    const { subtotal, tax, total } = computeTotals(input.items, input.taxRate ?? 0);
    return this.prisma.withTenant(orgId, async (tx) => {
      const quote = await tx.quote.create({
        data: {
          orgId, number: input.number, contactId: input.contactId, companyId: input.companyId,
          validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
          subtotal, tax, total, issuedById, status: 'DRAFT',
        },
      });
      await tx.quoteItem.createMany({
        data: input.items.map((l) => ({
          orgId, quoteId: quote.id, productId: l.productId, description: l.description,
          qty: l.qty, unitPrice: l.unitPrice, lineTotal: Math.round(l.qty * l.unitPrice * 100) / 100,
        })),
      });
      return quote;
    });
  }

  /** Mark a quote SENT (a real workflow step). */
  async sendQuote(orgId: string, id: string) {
    const quote = await this.prisma.withTenant(orgId, (tx) => tx.quote.findFirst({ where: { id, orgId } }));
    if (!quote) throw new ApiException('NOT_FOUND');
    return this.prisma.withTenant(orgId, (tx) => tx.quote.update({ where: { id }, data: { status: 'SENT' as QuoteStatus } }));
  }

  async updateQuoteStatus(orgId: string, id: string, status: QuoteStatus) {
    const quote = await this.prisma.withTenant(orgId, (tx) => tx.quote.findFirst({ where: { id, orgId } }));
    if (!quote) throw new ApiException('NOT_FOUND');
    return this.prisma.withTenant(orgId, (tx) => tx.quote.update({ where: { id }, data: { status } }));
  }

  // ---- Sales targets ---------------------------------------------------------
  async targets(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.salesTarget.findMany({ where: { orgId }, orderBy: { period: 'desc' } }));
  }

  async upsertTarget(orgId: string, input: { period: string; amount: number; ownerId?: string }) {
    return this.prisma.withTenant(orgId, (tx) =>
      tx.salesTarget.upsert({
        where: { orgId_period: { orgId, period: input.period } },
        update: { amount: input.amount },
        create: { orgId, period: input.period, amount: input.amount, ownerId: input.ownerId },
      }),
    );
  }
}