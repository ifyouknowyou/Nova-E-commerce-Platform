import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { slugify } from '../common/slugify';
import { toMembershipResponse, toOrganizationResponse, type MembershipResponse, type OrganizationResponse } from './organization.types';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  /** All orgs the user is an ACTIVE member of (owner or invited). */
  async listMine(userId: string): Promise<OrganizationResponse[]> {
    const memberships = await this.prisma.db.organizationMembership.findMany({
      where: { userId, status: 'ACTIVE' },
      include: { organization: true },
      orderBy: { joinedAt: 'asc' },
    });
    return memberships.map((m) => toOrganizationResponse(m.organization));
  }

  async getById(orgId: string, userId: string, isAdmin = false): Promise<OrganizationResponse> {
    const org = await this.prisma.db.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');
    const member = await this.prisma.db.organizationMembership.findFirst({
      where: { organizationId: orgId, userId, status: 'ACTIVE' },
    });
    if (!member && !isAdmin) throw new ForbiddenException('You are not a member of this organization');
    return toOrganizationResponse(org);
  }

  async create(userId: string, name: string, slug?: string): Promise<OrganizationResponse> {
    const finalSlug = slug?.trim() || slugify(name);
    const uniqueSlug = await this.ensureUniqueSlug(finalSlug);
    const org = await this.prisma.db.organization.create({
      data: {
        ownerId: userId,
        name,
        slug: uniqueSlug,
        memberships: {
          create: {
            userId,
            roleCodes: ['ORG_OWNER'],
            status: 'ACTIVE',
            invitedBy: userId,
          },
        },
      },
    });
    return toOrganizationResponse(org);
  }

  async update(
    orgId: string,
    userId: string,
    isAdmin: boolean,
    dto: { name?: string; bio?: string; contactEmail?: string; settings?: Record<string, unknown> },
  ): Promise<OrganizationResponse> {
    await this.assertManage(orgId, userId, isAdmin);
    const data: Record<string, unknown> = {};
    if (dto.name) data.name = dto.name;
    if (dto.settings !== undefined) data.settings = dto.settings;
    const org = await this.prisma.db.organization.update({ where: { id: orgId }, data });
    return toOrganizationResponse(org);
  }

  async listMembers(orgId: string, userId: string, isAdmin = false): Promise<MembershipResponse[]> {
    await this.assertRead(orgId, userId, isAdmin);
    const members = await this.prisma.db.organizationMembership.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: 'asc' },
    });
    return members.map((m) => toMembershipResponse(m));
  }

  // ── guards ──────────────────────────────────────────────────────────────

  async assertRead(orgId: string, userId: string, isAdmin = false): Promise<void> {
    if (isAdmin) return;
    const member = await this.prisma.db.organizationMembership.findFirst({
      where: { organizationId: orgId, userId, status: 'ACTIVE' },
    });
    if (!member) throw new ForbiddenException('You are not a member of this organization');
  }

  async assertManage(orgId: string, userId: string, isAdmin = false): Promise<void> {
    if (isAdmin) return;
    const member = await this.prisma.db.organizationMembership.findFirst({
      where: { organizationId: orgId, userId, status: 'ACTIVE' },
    });
    if (!member || !member.roleCodes.includes('ORG_OWNER')) {
      throw new ForbiddenException('Only an organization owner can perform this action');
    }
  }

  private async ensureUniqueSlug(base: string): Promise<string> {
    let slug = base;
    let n = 1;
    while (true) {
      const existing = await this.prisma.db.organization.findUnique({ where: { slug } });
      if (!existing) return slug;
      n += 1;
      slug = `${base}-${n}`;
    }
  }
}
