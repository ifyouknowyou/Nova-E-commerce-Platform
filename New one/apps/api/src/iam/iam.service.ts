import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RoleDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  permissionCodes: string[];
}

/**
 * IAM reads are tenant-scoped (orgId from the session) and RLS-enforced via
 * withTenant. A role's permissionCodes are resolved from the role's wiring.
 */
@Injectable()
export class IamService {
  constructor(private readonly prisma: PrismaService) {}

  async listRoles(orgId: string): Promise<RoleDto[]> {
    return this.prisma.withTenant(orgId, async (tx) => {
      const roles = await tx.role.findMany({
        where: { orgId },
        include: { permissions: { include: { permission: true } } },
        orderBy: { code: 'asc' },
      });
      return roles.map((role) => ({
        id: role.id,
        code: role.code,
        name: role.name,
        description: role.description,
        permissionCodes: role.permissions.map((rp) => rp.permission.code),
      }));
    });
  }
}