import { Injectable } from '@nestjs/common';
import { ApiException } from '../../common/exceptions';
import { CrmService } from '../../crm/crm.service';
import { FinanceService } from '../../finance/finance.service';
import { InventoryService } from '../../inventory/inventory.service';
import { ProjectsService } from '../../projects/projects.service';
import { SupportService } from '../../support/support.service';
import type { AiToolDef } from './tool.types';

/**
 * AI Tool System — the catalogue of platform functions the Copilot/Agents may
 * call. Every tool is real: read/low tools hit live tenant data via the real
 * services (inside withTenant ⇒ RLS-scoped). HIGH/SENSITIVE tools (recordPayment,
 * changeInventory, …) are defined the same way, but the ToolRunner refuses to
 * invoke them without an approved AiApprovalRequest — no sensitive handler is
 * ever reachable outside the approval path.
 */
@Injectable()
export class ToolRegistry {
  private readonly tools = new Map<string, AiToolDef>();

  constructor(
    private readonly crm: CrmService,
    private readonly finance: FinanceService,
    private readonly inventory: InventoryService,
    private readonly projects: ProjectsService,
    private readonly support: SupportService,
  ) {
    this.register([
      // ── Read tools ────────────────────────────────────────────────────────────
      {
        name: 'searchCustomers',
        description: 'Search companies and contacts by name. Use when asked about customers, companies, or contacts.',
        keywords: ['customer', 'company', 'contact', 'client'],
        risk: 'READ',
        permission: 'ai.tool.execute',
        inputSchema: { type: 'object', properties: { search: { type: 'string', description: 'Search term' } } },
        handler: async ({ orgId }, input) => {
          const search = String(input.search ?? '');
          const companies = await this.crm.companies(orgId, search ? { search } : {});
          const contacts = await this.crm.contacts(orgId, search ? { search } : {});
          const items = [
            ...companies.items.map((c) => ({ id: c.id, name: c.name, type: 'company' })),
            ...contacts.items.map((c) => ({ id: c.id, name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(), type: 'contact' })),
          ].slice(0, 20);
          return {
            summary: `Found ${items.length} matching customers/contacts.`,
            items, total: items.length, label: 'Matching customers/contacts',
          };
        },
      },
      {
        name: 'searchDeals',
        description: 'Search deals by name. Use when asked about deals, opportunities, or pipeline.',
        keywords: ['deal', 'pipeline', 'opportunity', 'won deal'],
        risk: 'READ',
        permission: 'ai.tool.execute',
        inputSchema: { type: 'object', properties: { search: { type: 'string', description: 'Search term' } } },
        handler: async ({ orgId }, input) => {
          const search = String(input.search ?? '');
          const deals = await this.crm.deals(orgId, search ? { search } : {});
          return {
            summary: `Found ${deals.total} deals.`,
            items: deals.items.map((d) => ({ id: d.id, name: d.name, stage: d.stage, value: d.value ?? 0 })),
            total: deals.total, label: 'Deals',
          };
        },
      },
      {
        name: 'getSalesSummary',
        description: 'Summarize sales performance: total revenue, open deals, won deals, invoice totals.',
        keywords: ['sales', 'revenue', 'revenue this month', 'perform', 'forecast'],
        risk: 'READ',
        permission: 'ai.tool.execute',
        inputSchema: { type: 'object', properties: {} },
        handler: async ({ orgId }) => {
          const [deals, invoices] = await Promise.all([
            this.crm.deals(orgId, {}),
            this.finance.invoices(orgId),
          ]);
          const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0));
          const openDeals = deals.items.filter((d) => d.stage === 'QUALIFIED' || d.stage === 'PROPOSAL' || d.stage === 'NEGOTIATION');
          const wonDeals = deals.items.filter((d) => d.stage === 'WON');
          const openValue = openDeals.reduce((s, d) => s + num(d.value), 0);
          const wonValue = wonDeals.reduce((s, d) => s + num(d.value), 0);
          const invoicedTotal = invoices.reduce((s, i) => s + num(i.total), 0);
          const paidTotal = invoices.reduce((s, i) => s + num(i.paidAmount), 0);
          const items = [{ metric: 'openDeals', value: openDeals.length, openValue }, { metric: 'wonDeals', value: wonDeals.length, wonValue }, { metric: 'invoiced', value: invoices.length, invoicedTotal }, { metric: 'collected', value: paidTotal }];
          return {
            summary: `Sales: ${openDeals.length} open deals (${openValue} pipeline), ${wonDeals.length} won (${wonValue}), ${invoices.length} invoices totalling ${invoicedTotal}, ${paidTotal} collected.`,
            items, total: openDeals.length, label: 'Sales summary',
          };
        },
      },
      {
        name: 'getInvoiceStatus',
        description: 'Get invoice statuses and totals. Use when asked about invoices, billing, overdue, or payments.',
        keywords: ['invoice', 'billing', 'overdue', 'paid', 'payment'],
        risk: 'READ',
        permission: 'ai.tool.execute',
        inputSchema: { type: 'object', properties: { search: { type: 'string', description: 'Optional invoice number' } } },
        handler: async ({ orgId }, input) => {
          const invoices = await this.finance.invoices(orgId);
          const search = String(input.search ?? '').toLowerCase();
          const list = invoices.filter((i) => !search || i.number.toLowerCase().includes(search));
          return {
            summary: `${list.length} invoices, ${list.filter((i) => i.status === 'OVERDUE').length} overdue, ${list.filter((i) => i.status === 'PAID').length} paid.`,
            items: list.slice(0, 20).map((i) => ({ id: i.id, number: i.number, status: i.status, total: i.total })),
            total: list.length, label: 'Invoices',
          };
        },
      },
      {
        name: 'getInventoryStatus',
        description: 'Get current stock levels and low-stock alerts. Use when asked about inventory, stock, or reorder.',
        keywords: ['inventory', 'stock', 'reorder', 'low stock'],
        risk: 'READ',
        permission: 'ai.tool.execute',
        inputSchema: { type: 'object', properties: { lowOnly: { type: 'boolean', description: 'Only items at/below reorder level' } } },
        handler: async ({ orgId }, input) => {
          const lowOnly = Boolean(input.lowOnly);
          const stock = await this.inventory.stock(orgId, lowOnly);
          const low = stock.filter((s) => s.qty <= s.reorderLevel);
          return {
            summary: `${stock.length} stock lines${lowOnly ? ' at/below reorder level' : `, ${low.length} low`}.`,
            items: stock.slice(0, 30).map((s) => ({ id: s.id, name: s.productName, qty: s.qty, reorderLevel: s.reorderLevel })),
            total: stock.length, label: 'Stock levels',
          };
        },
      },
      {
        name: 'getProjectStatus',
        description: 'Get project and task status. Use when asked about projects, tasks, or milestones.',
        keywords: ['project', 'task', 'milestone', 'status'],
        risk: 'READ',
        permission: 'ai.tool.execute',
        inputSchema: { type: 'object', properties: { search: { type: 'string', description: 'Optional project name' } } },
        handler: async ({ orgId }, input) => {
          const search = String(input.search ?? '').toLowerCase();
          const projects = await this.projects.list(orgId);
          const list = projects.filter((p) => !search || p.name.toLowerCase().includes(search));
          return {
            summary: `${list.length} projects (${list.filter((p) => p.status === 'ACTIVE').length} active).`,
            items: list.map((p) => ({ id: p.id, name: p.name, status: p.status, taskCount: p.taskCount })),
            total: list.length, label: 'Projects',
          };
        },
      },
      {
        name: 'getSupportQueue',
        description: 'Get support tickets and their status. Use when asked about tickets, support, or customer issues.',
        keywords: ['ticket', 'support', 'issue', 'queue'],
        risk: 'READ',
        permission: 'ai.tool.execute',
        inputSchema: { type: 'object', properties: { status: { type: 'string', description: 'Optional filter (OPEN/IN_PROGRESS/WAITING/RESOLVED/CLOSED)' } } },
        handler: async ({ orgId }, input) => {
          const tickets = await this.support.tickets(orgId);
          const status = String(input.status ?? '').toUpperCase();
          const list = tickets.filter((t) => !status || t.status === status);
          return {
            summary: `${list.length} tickets${status ? ` (${status})` : ''}, ${list.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length} active.`,
            items: list.slice(0, 20).map((t) => ({ id: t.id, subject: t.subject, status: t.status, priority: t.priority })),
            total: list.length, label: 'Support tickets',
          };
        },
      },
      // ── Low-risk action tools (executed directly) ────────────────────────────
      {
        name: 'createTask',
        description: 'Create a project task. Use when the user asks to create or add a task.',
        keywords: ['create task', 'add a task', 'todo'],
        risk: 'LOW',
        permission: 'project.task.create',
        inputSchema: {
          type: 'object', properties: {
            title: { type: 'string', description: 'Task title' },
            projectId: { type: 'string', description: 'Project id (optional)' },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'DONE'] },
          }, required: ['title'],
        },
        handler: async ({ orgId, actorId }, input) => {
          const task = await this.projects.createTask(orgId, {
            title: input.title, projectId: input.projectId ?? undefined,
            status: input.status ?? 'TODO', createdById: actorId,
          });
          return { summary: `Created task "${input.title}".`, items: [{ id: task.id, title: task.title, status: task.status }] };
        },
      },
      {
        name: 'createNote',
        description: 'Create a note/activity on a CRM record. Use when the user asks to add a note to a deal or customer.',
        keywords: ['add a note', 'note to', 'comment'],
        risk: 'LOW',
        permission: 'crm.activity.create',
        inputSchema: {
          type: 'object', properties: {
            entityType: { type: 'string', description: 'deal | company | contact' },
            entityId: { type: 'string', description: 'Entity id' },
            body: { type: 'string', description: 'Note text' },
          }, required: ['entityId', 'body'],
        },
        handler: async ({ orgId, actorId }, input) => {
          await this.crm.createNote(orgId, {
            entityType: input.entityType ?? 'deal', entityId: input.entityId,
            body: input.body, userId: actorId, type: 'NOTE',
          });
          return { summary: 'Note added.', items: [{ entityId: input.entityId, body: input.body }] };
        },
      },
      // ── Sensitive action tools (NEVER execute without an approval) ────────────
      {
        name: 'recordPayment',
        description: 'Record a payment against an invoice. IRREVERSIBLE financial action — requires human approval.',
        keywords: ['record payment', 'collect', 'payment for invoice', 'apply payment'],
        risk: 'SENSITIVE',
        permission: 'finance.payment.create',
        inputSchema: {
          type: 'object', properties: {
            invoiceId: { type: 'string', description: 'Invoice id' },
            amount: { type: 'number', description: 'Amount' },
            method: { type: 'string', enum: ['CARD', 'BANK_TRANSFER', 'CASH', 'OTHER'] },
            reference: { type: 'string' },
          }, required: ['invoiceId', 'amount'],
        },
        handler: async ({ orgId, actorId }, input) => {
          const payment = await this.finance.recordPayment(orgId, String(input.invoiceId), {
            amount: Number(input.amount), method: input.method as never, reference: input.reference as string | undefined,
          });
          return { summary: `Recorded payment ${input.amount} against invoice.`, items: [payment] };
        },
      },
      {
        name: 'changeInventory',
        description: 'Move stock IN or OUT for a product at a location. Irreversible stock change — requires human approval.',
        keywords: ['restock', 'adjust stock', 'move stock', 'stock in', 'stock out'],
        risk: 'SENSITIVE',
        permission: 'inventory.product.update',
        inputSchema: {
          type: 'object', properties: {
            productId: { type: 'string', description: 'Product id' },
            locationId: { type: 'string', description: 'Stock location id' },
            type: { type: 'string', enum: ['IN', 'OUT', 'ADJUSTMENT'] },
            qty: { type: 'integer', description: 'Quantity' },
            note: { type: 'string' },
          }, required: ['productId', 'locationId', 'type', 'qty'],
        },
        handler: async ({ orgId, actorId }, input) => {
          const moved = await this.inventory.movement(orgId, actorId, input.type as never, {
            productId: input.productId as string,
            locationId: input.locationId as string,
            type: input.type as never,
            qty: Number(input.qty),
            note: input.note as string | undefined,
          } as never);
          return { summary: `Stock ${input.type} of ${input.qty} applied.`, items: [moved] };
        },
      },
    ]);
  }

  private register(defs: AiToolDef[]): void {
    for (const def of defs) {
      if (this.tools.has(def.name)) throw new Error(`Duplicate AI tool: ${def.name}`);
      this.tools.set(def.name, def);
    }
  }

  get(name: string): AiToolDef | undefined {
    return this.tools.get(name);
  }

  /** All tool definitions (for the LLM catalogue). */
  list(): AiToolDef[] {
    return [...this.tools.values()];
  }

  /** Tools a caller is allowed to SEE (RBAC-permissioned, optional filter by max risk). */
  permitted(defs: AiToolDef[], hasPermission: (code: string) => boolean, maxRisk?: string): AiToolDef[] {
    return defs.filter((t) => hasPermission(t.permission) && (!maxRisk || t.risk === maxRisk || t.risk === 'READ'));
  }

  /** Convenience guard for handlers that must never be called directly. */
  assertApprovedContext(): never {
    throw new ApiException('FORBIDDEN', { message: 'Sensitive AI tool requires an approved approval request' });
  }
}
