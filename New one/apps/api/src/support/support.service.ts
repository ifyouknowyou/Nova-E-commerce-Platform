import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/exceptions';

/**
 * Support — tickets with status/priority/assignment, plus comments where
 * `internal` notes are only returned to callers with `support.ticket.update`
 * (agents), never to plain ticket readers.
 */
@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async tickets(orgId: string, includeInternalNotes = false) {
    const tickets = await this.prisma.withTenant(orgId, (tx) =>
      tx.ticket.findMany({ where: { orgId }, orderBy: { updatedAt: 'desc' }, take: 200 }),
    );
    if (!includeInternalNotes) return tickets;
    return tickets;
  }

  async createTicket(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.ticket.create({ data: { ...data, orgId } as never }));
  }

  async detail(orgId: string, id: string, canSeeInternal: boolean) {
    const ticket = await this.prisma.withTenant(orgId, (tx) => tx.ticket.findFirst({ where: { id, orgId } }));
    if (!ticket) throw new ApiException('NOT_FOUND');
    const comments = await this.prisma.withTenant(orgId, (tx) =>
      tx.ticketComment.findMany({
        where: { orgId, ticketId: id, ...(canSeeInternal ? {} : { internal: false }) },
        orderBy: { createdAt: 'asc' },
      }),
    );
    return { ...ticket, comments };
  }

  async setStatus(orgId: string, id: string, status: string) {
    const ticket = await this.prisma.withTenant(orgId, (tx) => tx.ticket.findFirst({ where: { id, orgId } }));
    if (!ticket) throw new ApiException('NOT_FOUND');
    return this.prisma.withTenant(orgId, (tx) => tx.ticket.update({ where: { id }, data: { status: status as never } }));
  }

  async assign(orgId: string, id: string, assignedToId: string | null) {
    const ticket = await this.prisma.withTenant(orgId, (tx) => tx.ticket.findFirst({ where: { id, orgId } }));
    if (!ticket) throw new ApiException('NOT_FOUND');
    return this.prisma.withTenant(orgId, (tx) => tx.ticket.update({ where: { id }, data: { assignedToId } }));
  }

  async addComment(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.ticketComment.create({ data: { ...data, orgId } as never }));
  }
}