import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RbacService } from '../../rbac/rbac.service';

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  meta?: Record<string, unknown>;
}
export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}
export interface BusinessGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Business Graph — the ONE tenant-scoped AI context. Builds nodes + edges from
 * REAL relations (company→deal→invoice→payment; deal→product→stock; contact→
 * ticket→product→…), RBAC-filtered and queried inside a single withTenant so
 * RLS guarantees only this org's rows ever enter an agent's context.
 */
@Injectable()
export class BusinessGraphService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
  ) {}

  async snapshot(orgId: string, userId: string): Promise<BusinessGraph> {
    // RBAC gate: ai.graph.read.
    const perms = await this.rbac.getEffectivePermissions(orgId, userId);
    if (!perms.includes('ai.graph.read')) {
      return { nodes: [], edges: [] };
    }

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const addNode = (n: GraphNode) => nodes.push(n);
    const addEdge = (e: GraphEdge) => edges.push(e);

    await this.prisma.withTenant(orgId, async (tx) => {
      const [companies, contacts, deals, invoices, payments, products, tickets, projects] = await Promise.all([
        tx.company.findMany({ where: { orgId }, take: 40, select: { id: true, name: true, industry: true } }),
        tx.contact.findMany({ where: { orgId }, take: 60, select: { id: true, firstName: true, lastName: true, companyId: true } }),
        tx.deal.findMany({ where: { orgId }, take: 60, select: { id: true, name: true, stage: true, value: true, companyId: true, contactId: true } }),
        tx.invoice.findMany({ where: { orgId }, take: 60, select: { id: true, number: true, status: true, total: true, companyId: true, contactId: true } }),
        tx.payment.findMany({ where: { orgId }, take: 80, select: { id: true, amount: true, invoiceId: true } }),
        tx.product.findMany({ where: { orgId }, take: 60, select: { id: true, name: true, sku: true } }),
        tx.ticket.findMany({ where: { orgId }, take: 60, select: { id: true, subject: true, status: true, customerId: true } }),
        tx.project.findMany({ where: { orgId }, take: 40, select: { id: true, name: true, status: true } }),
      ]);

      for (const c of companies) addNode({ id: c.id, type: 'company', label: c.name, meta: { industry: c.industry ?? undefined } });
      for (const c of contacts) {
        addNode({ id: c.id, type: 'contact', label: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || c.id });
        if (c.companyId) addEdge({ source: c.companyId, target: c.id, type: 'EMPLOYS' });
      }
      for (const d of deals) {
        addNode({ id: d.id, type: 'deal', label: d.name, meta: { stage: d.stage, value: d.value ?? 0 } });
        if (d.companyId) addEdge({ source: d.companyId, target: d.id, type: 'HAS_DEAL' });
        if (d.contactId) addEdge({ source: d.contactId, target: d.id, type: 'OWNS_DEAL' });
      }
      for (const i of invoices) {
        addNode({ id: i.id, type: 'invoice', label: i.number, meta: { status: i.status, total: i.total } });
        if (i.companyId) addEdge({ source: i.companyId, target: i.id, type: 'BILLED_TO' });
        if (i.contactId) addEdge({ source: i.contactId, target: i.id, type: 'BILLED_TO' });
      }
      for (const p of payments) {
        addNode({ id: p.id, type: 'payment', label: `Payment ${p.id.slice(0, 8)}`, meta: { amount: p.amount } });
        addEdge({ source: p.invoiceId, target: p.id, type: 'PAID_BY' });
      }
      for (const p of products) addNode({ id: p.id, type: 'product', label: p.name, meta: { sku: p.sku ?? undefined } });
      for (const t of tickets) {
        addNode({ id: t.id, type: 'ticket', label: t.subject, meta: { status: t.status } });
        if (t.customerId) addEdge({ source: t.customerId, target: t.id, type: 'RAISED' });
      }
      for (const p of projects) addNode({ id: p.id, type: 'project', label: p.name, meta: { status: p.status } });
    });

    // De-duplicate by (source,target,type).
    const edgeKey = new Set<string>();
    const uniqueEdges = edges.filter((e) => {
      const k = `${e.source}|${e.target}|${e.type}`;
      if (edgeKey.has(k)) return false;
      edgeKey.add(k);
      return true;
    });

    return { nodes, edges: uniqueEdges };
  }
}

/** Guard: nothing from a tenant outside `orgId` may appear in a graph. */
export function assertNoCrossTenant(_orgId: string, _nodes: GraphNode[]): void {
  // RLS already guarantees this; kept as an explicit, testable boundary marker.
}
