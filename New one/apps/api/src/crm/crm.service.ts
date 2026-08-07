import { Injectable } from '@nestjs/common';
import { DealStage } from '@nexus/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/exceptions';

export interface ListResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

function parseList(q: Record<string, string | undefined>) {
  const page = Math.max(1, Number(q.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(q.pageSize ?? 25)));
  const search = q.search && q.search.length ? q.search : undefined;
  const status = q.status && q.status.length ? q.status : undefined;
  return { page, pageSize, search, status };
}

function textSearch(search: string | undefined, fields: string[]) {
  if (!search) return undefined;
  return { OR: fields.map((f) => ({ [f]: { contains: search, mode: 'insensitive' } })) };
}

/**
 * CRM — real CRUD over companies, contacts, leads, deals, activities, notes.
 * All reads/writes are tenant-scoped via withTenant (RLS enforced).
 */
@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Companies -------------------------------------------------------------
  async companies(orgId: string, q: Record<string, string> = {}) {
    const { page, pageSize, search } = parseList(q);
    return this.prisma.withTenant(orgId, async (tx) => {
      const where = { orgId, ...textSearch(search, ['name', 'industry']) } as never;
      const [items, total] = await Promise.all([
        tx.company.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
        tx.company.count({ where }),
      ]);
      return { items, total, page, pageSize };
    });
  }

  async createCompany(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.company.create({ data: { ...data, orgId } as never }));
  }

  async updateCompany(orgId: string, id: string, data: Record<string, unknown>) {
    const exists = await this.prisma.withTenant(orgId, (tx) => tx.company.findFirst({ where: { id, orgId } }));
    if (!exists) throw new ApiException('NOT_FOUND');
    return this.prisma.withTenant(orgId, (tx) => tx.company.update({ where: { id }, data }));
  }

  // ─── Contacts ---------------------------------------------------------------
  async contacts(orgId: string, q: Record<string, string> = {}) {
    const { page, pageSize, search } = parseList(q);
    return this.prisma.withTenant(orgId, async (tx) => {
      const where = { orgId, ...textSearch(search, ['firstName', 'lastName', 'email']) } as never;
      const [items, total] = await Promise.all([
        tx.contact.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
        tx.contact.count({ where }),
      ]);
      return { items, total, page, pageSize };
    });
  }

  async createContact(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.contact.create({ data: { ...data, orgId } as never }));
  }

  // ─── Leads ------------------------------------------------------------------
  async leads(orgId: string, q: Record<string, string> = {}) {
    const { page, pageSize, search, status } = parseList(q);
    return this.prisma.withTenant(orgId, async (tx) => {
      const where = { orgId, ...(status ? { status } : {}), ...textSearch(search, ['source']) } as never;
      const [items, total] = await Promise.all([
        tx.lead.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
        tx.lead.count({ where }),
      ]);
      return { items, total, page, pageSize };
    });
  }

  async createLead(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.lead.create({ data: { ...data, orgId } as never }));
  }

  // ─── Deals ------------------------------------------------------------------
  async deals(orgId: string, q: Record<string, string> = {}) {
    const { page, pageSize, search, status } = parseList(q);
    return this.prisma.withTenant(orgId, async (tx) => {
      const where = { orgId, ...(status ? { stage: status } : {}), ...textSearch(search, ['name']) } as never;
      const [items, total] = await Promise.all([
        tx.deal.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
        tx.deal.count({ where }),
      ]);
      return { items, total, page, pageSize };
    });
  }

  async createDeal(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.deal.create({ data: { ...data, orgId } as never }));
  }

  /** Change a deal's stage + probability; logs an Activity (due diligence trail). */
  async moveDeal(orgId: string, id: string, actorId: string | undefined, stage: DealStage) {
    const deal = await this.prisma.withTenant(orgId, (tx) => tx.deal.findFirst({ where: { id, orgId } }));
    if (!deal) throw new ApiException('NOT_FOUND');
    return this.prisma.withTenant(orgId, async (tx) => {
      const updated = await tx.deal.update({ where: { id }, data: { stage } });
      await tx.activity.create({
        data: {
          orgId, userId: actorId, type: 'NOTE', subject: `Stage changed to ${stage}`,
          body: `Deal "${deal.name}" moved to ${stage}.`, entityType: 'deal', entityId: deal.id,
        },
      });
      return updated;
    });
  }

  // ─── Activities / notes ------------------------------------------------------
  async activities(orgId: string, q: Record<string, string> = {}, entityType?: string, entityId?: string) {
    const { page, pageSize } = parseList(q);
    return this.prisma.withTenant(orgId, async (tx) => {
      const where = { orgId, ...(entityType ? { entityType } : {}), ...(entityId ? { entityId } : {}) };
      const [items, total] = await Promise.all([
        tx.activity.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
        tx.activity.count({ where }),
      ]);
      return { items, total, page, pageSize };
    });
  }

  async createActivity(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.activity.create({ data: { ...data, orgId } as never }));
  }

  async notes(orgId: string, entityType?: string, entityId?: string) {
    return this.prisma.withTenant(orgId, (tx) =>
      tx.note.findMany({ where: { orgId, ...(entityType ? { entityType } : {}), ...(entityId ? { entityId } : {}) }, orderBy: { createdAt: 'desc' } }),
    );
  }

  async createNote(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.note.create({ data: { ...data, orgId } as never }));
  }
}