import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Global search across tenant-scoped entities. Each category maps to a required
 * permission; the caller's effective permissions decide which categories appear
 * (RBAC-aware). All queries are inside withTenant (tenant-scoped).
 *
 * Pure helper below is exported for unit tests.
 */

export interface SearchCategoryDef {
  key: string;
  permission: string;
  label?: string;
  fields: string[];
}

export function filterByPermissions(
  userPermissions: string[],
  categories: SearchCategoryDef[],
): SearchCategoryDef[] {
  return categories.filter((c) => userPermissions.includes(c.permission));
}


@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  private static categories(userPermissions: string[]): SearchCategoryDef[] {
    return filterByPermissions(userPermissions, [
      { key: 'companies', permission: 'crm.company.read', fields: ['name', 'industry'] },
      { key: 'contacts', permission: 'crm.contact.read', fields: ['firstName', 'lastName', 'email'] },
      { key: 'deals', permission: 'crm.deal.read', fields: ['name'] },
      { key: 'leads', permission: 'crm.lead.read', fields: ['source'] },
      { key: 'products', permission: 'inventory.product.read', fields: ['name', 'sku'] },
      { key: 'projects', permission: 'project.project.read', fields: ['name'] },
      { key: 'tasks', permission: 'project.task.read', fields: ['title'] },
      { key: 'tickets', permission: 'support.ticket.read', fields: ['subject'] },
      { key: 'employees', permission: 'hr.employee.read', fields: ['firstName', 'lastName', 'email'] },
      { key: 'invoices', permission: 'finance.invoice.read', fields: ['number'] },
      { key: 'documents', permission: 'documents.read', fields: ['name'] },
    ]);
  }

  /** Run a cross-entity, RBAC- and tenant-scoped search. */
  async search(orgId: string, userPermissions: string[], q: string) {
    const term = q.trim();
    if (!term) return { query: term, results: [] };

    const cats = SearchService.categories(userPermissions);
    if (!cats.length) return { query: term, results: [] };

    const like = { contains: term, mode: 'insensitive' as const };

    const results: Record<string, unknown[]> = {};
    await this.prisma.withTenant(orgId, async (tx) => {
      for (const c of cats) {
        const rows = await searchOne(tx, c.key, c.fields, like);
        results[c.key] = rows.slice(0, 8);
      }
    });
    return { query: term, results };
  }
}

async function searchOne(tx: any, key: string, fields: string[], like: { contains: string; mode: 'insensitive' }) {
  const where = { OR: fields.map((f) => ({ [f]: like })) };
  switch (key) {
    case 'companies': return tx.company.findMany({ where: { ...where }, take: 8, select: { id: true, name: true } });
    case 'contacts': return tx.contact.findMany({ where: { ...where }, take: 8, select: { id: true, firstName: true, lastName: true, email: true } });
    case 'deals': return tx.deal.findMany({ where: { ...where }, take: 8, select: { id: true, name: true } });
    case 'leads': return tx.lead.findMany({ where: { ...where }, take: 8, select: { id: true, source: true, status: true } });
    case 'products': return tx.product.findMany({ where: { ...where }, take: 8, select: { id: true, name: true } });
    case 'projects': return tx.project.findMany({ where: { ...where }, take: 8, select: { id: true, name: true } });
    case 'tasks': return tx.task.findMany({ where: { ...where }, take: 8, select: { id: true, title: true } });
    case 'tickets': return tx.ticket.findMany({ where: { ...where }, take: 8, select: { id: true, subject: true } });
    case 'employees': return tx.employee.findMany({ where: { ...where }, take: 8, select: { id: true, firstName: true, lastName: true, email: true } });
    case 'invoices': return tx.invoice.findMany({ where: { ...where }, take: 8, select: { id: true, number: true } });
    case 'documents': return tx.document.findMany({ where: { ...where }, take: 8, select: { id: true, name: true } });
    default: return [];
  }
}