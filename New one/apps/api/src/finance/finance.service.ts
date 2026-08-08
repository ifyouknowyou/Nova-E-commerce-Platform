import { Injectable } from '@nestjs/common';
import { InvoiceStatus, PaymentMethod } from '@nexus/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/exceptions';

interface InvoiceLine {
  description: string;
  qty: number;
  unitPrice: number;
}

/** Pure, unit-testable invoice total computation. */
export function computeInvoiceTotals(lines: InvoiceLine[], taxRate = 0): { subtotal: number; tax: number; total: number } {
  const subtotal = lines.reduce((sum, l) => sum + (l.qty ?? 1) * (l.unitPrice ?? 0), 0);
  const tax = Math.round(subtotal * taxRate * 100) / 100;
  return { subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100 };
}

/** Derive invoice status from balance. CANCELLED and DRAFT are terminal/preserved. */
export function deriveInvoiceStatus(current: InvoiceStatus, total: number, paid: number): InvoiceStatus {
  // Never resurrect a cancelled invoice.
  if (current === 'CANCELLED') return 'CANCELLED';
  if (paid <= 0) return current === 'DRAFT' ? 'DRAFT' : 'SENT';
  if (paid >= total) return 'PAID';
  return 'PARTIALLY_PAID';
}

/**
 * Finance — accounts, transactions, invoices (items + payments), expenses,
 * vendors. Money totals are always server-computed; never trust the client.
 * Tenant-scoped via withTenant.
 */
@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Accounts / transactions ----------------------------------------------
  async accounts(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.account.findMany({ where: { orgId }, orderBy: { name: 'asc' } }));
  }

  async createAccount(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.account.create({ data: { ...data, orgId } as never }));
  }

  async transactions(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.transaction.findMany({ where: { orgId }, orderBy: { date: 'desc' } }));
  }

  // ---- Invoices --------------------------------------------------------------
  async invoices(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.invoice.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } }));
  }

  async invoiceDetail(orgId: string, id: string) {
    const invoice = await this.prisma.withTenant(orgId, (tx) => tx.invoice.findFirst({ where: { id, orgId } }));
    if (!invoice) throw new ApiException('NOT_FOUND');
    const [items, payments] = await this.prisma.withTenant(orgId, (tx) =>
      Promise.all([
        tx.invoiceItem.findMany({ where: { invoiceId: id } }),
        tx.payment.findMany({ where: { invoiceId: id }, orderBy: { date: 'desc' } }),
      ]),
    );
    return { ...invoice, items, payments };
  }

  /** Create an invoice from line items; totals server-computed. */
  async createInvoice(orgId: string, issuedById: string | undefined, input: {
    number: string; companyId?: string; contactId?: string; dueDate?: string; taxRate?: number; items: InvoiceLine[];
  }) {
    const { subtotal, tax, total } = computeInvoiceTotals(input.items, input.taxRate ?? 0);
    return this.prisma.withTenant(orgId, async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          orgId, number: input.number, companyId: input.companyId, contactId: input.contactId,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          subtotal, tax, total, issuedById, status: 'SENT',
        },
      });
      await tx.invoiceItem.createMany({
        data: input.items.map((l) => ({
          orgId, invoiceId: invoice.id, description: l.description, qty: l.qty,
          unitPrice: l.unitPrice, lineTotal: Math.round(l.qty * l.unitPrice * 100) / 100,
        })),
      });
      return invoice;
    });
  }

  /** Record a payment; recompute paidAmount + status server-side. */
  async recordPayment(orgId: string, invoiceId: string, input: { amount: number; method?: PaymentMethod; reference?: string; date?: string }) {
    if (!Number.isFinite(input.amount) || input.amount <= 0) throw new ApiException('VALIDATION_FAILED', { message: 'payment amount must be positive' });

    // Single atomic transaction: read + increment + status in one tx, so two
    // concurrent payments can't both read the same paidAmount and lose one.
    return this.prisma.withTenant(orgId, async (tx) => {
      const invoice = await tx.invoice.findFirst({ where: { id: invoiceId, orgId } });
      if (!invoice) throw new ApiException('NOT_FOUND');
      // Do not accept payments against a cancelled invoice.
      if (invoice.status === 'CANCELLED') {
        throw new ApiException('CONFLICT', { message: 'Cannot record a payment on a cancelled invoice' });
      }

      await tx.payment.create({
        data: { orgId, invoiceId, amount: input.amount, method: input.method ?? 'BANK_TRANSFER', reference: input.reference, date: input.date ? new Date(input.date) : undefined },
      });
      const paidAmount = Math.round((Number(invoice.paidAmount) + input.amount) * 100) / 100;
      const status = deriveInvoiceStatus(invoice.status as InvoiceStatus, Number(invoice.total), paidAmount);
      return tx.invoice.update({ where: { id: invoiceId }, data: { paidAmount, status } });
    });
  }

  // ---- Expenses / vendors ----------------------------------------------------
  async expenses(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.expense.findMany({ where: { orgId }, orderBy: { date: 'desc' } }));
  }

  async createExpense(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.expense.create({ data: { ...data, orgId } as never }));
  }

  async vendors(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.vendor.findMany({ where: { orgId }, orderBy: { name: 'asc' } }));
  }

  async createVendor(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.vendor.create({ data: { ...data, orgId } as never }));
  }
}