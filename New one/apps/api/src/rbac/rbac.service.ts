import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * RBAC resolution (upgrade Decision 3). The guard calls getEffectivePermissions
 * once per request; it resolves the user's org-scoped permissions from the DB
 * *inside* a tenant transaction so RLS ensures only that org's wiring is read.
 */
@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  /** Effective permission codes for `userId` within `orgId`. */
  async getEffectivePermissions(orgId: string, userId: string): Promise<string[]> {
    return this.prisma.withTenant(orgId, async (tx) => {
      const member = await tx.organizationMember.findFirst({
        where: { orgId, userId, status: 'ACTIVE' },
        select: { id: true },
      });
      if (!member) return [];

      const membershipRoles = await tx.membershipRole.findMany({
        where: { memberId: member.id },
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      });

      const codes = new Set<string>();
      for (const mr of membershipRoles) {
        for (const rp of mr.role.permissions) {
          if (rp.permission.code) codes.add(rp.permission.code);
        }
      }
      return [...codes];
    });
  }
}