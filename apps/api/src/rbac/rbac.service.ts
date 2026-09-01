import { ForbiddenException, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import type { Permission, RoleCode } from '@nova/shared';
import type { OrganizationMembership } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { RBAC_SEED } from './rbac.seed';

/** Minimal shape needed for org-scoped checks (avoids importing the full model). */
export type OrganizationMembershipLike = Pick<OrganizationMembership, 'roleCodes'>;

/** Maps org-scoped role codes to the Control Center permission codes they grant. */
const ORG_ROLE_PERMISSIONS: Record<string, string[]> = {
  ORG_OWNER: ['*'],
  ORG_ADMIN: [
    'organization:read', 'organization:update', 'store:read', 'store:update', 'store:manage',
    'products:read', 'products:create', 'products:update', 'products:delete',
    'categories:read', 'categories:manage', 'brands:read', 'brands:manage',
    'inventory:read', 'inventory:update', 'orders:read', 'orders:update', 'orders:refund',
    'customers:read', 'customers:update', 'coupons:read', 'coupons:manage',
    'marketing:read', 'marketing:manage', 'finance:read', 'finance:manage',
    'analytics:read', 'reports:read', 'team:read', 'team:invite', 'team:manage',
    'roles:read', 'roles:manage', 'integrations:read', 'integrations:manage',
    'domains:read', 'domains:manage', 'webhooks:read', 'webhooks:manage',
    'security:read', 'security:manage', 'billing:read', 'billing:manage',
    'notifications:read', 'notifications:manage', 'settings:read', 'settings:manage',
  ],
  ORG_MANAGER: [
    'organization:read', 'store:read', 'store:update', 'products:read', 'products:create',
    'products:update', 'categories:read', 'brands:read', 'inventory:read', 'inventory:update',
    'orders:read', 'orders:update', 'customers:read', 'coupons:read', 'marketing:read',
    'analytics:read', 'reports:read', 'team:read', 'integrations:read',
  ],
  ORG_STAFF: [
    'organization:read', 'store:read', 'products:read', 'categories:read', 'brands:read',
    'inventory:read', 'orders:read', 'customers:read', 'coupons:read', 'analytics:read',
  ],
};

const PERMS_CACHE_TTL_SECONDS = 60;
const cacheKey = (role: string): string => `rbac:perms:${role}`;

@Injectable()
export class RbacService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RbacService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Idempotent — ensures roles + permissions exist (safe on every boot). */
  async onApplicationBootstrap(): Promise<void> {
    try {
      await this.seed();
    } catch (err) {
      this.logger.error(`RBAC seed skipped: ${(err as Error).message}`);
    }
  }

  async seed(): Promise<void> {
    for (const role of RBAC_SEED) {
      const existing = await this.prisma.db.role.findUnique({ where: { code: role.code } });
      if (!existing) {
        await this.prisma.db.role.create({ data: { code: role.code, name: role.name, description: role.description, isSystem: true } });
      }
    }

    const permissionCodes = new Set<string>();
    for (const role of RBAC_SEED) role.permissions.forEach((p) => permissionCodes.add(p));
    const existingPerms = await this.prisma.db.permission.findMany();
    const existingCodes = new Set(existingPerms.map((p) => p.code));

    for (const code of permissionCodes) {
      if (!existingCodes.has(code)) {
        const module = code.split(':')[0] ?? 'system';
        await this.prisma.db.permission.create({ data: { code, module } });
      }
    }

    // Sync role→permission mappings.
    for (const role of RBAC_SEED) {
      const dbRole = await this.prisma.db.role.findUnique({ where: { code: role.code } });
      if (!dbRole) continue;
      const permissions = await this.prisma.db.permission.findMany({
        where: { code: { in: [...role.permissions] } },
        select: { id: true },
      });
      await this.prisma.db.$transaction([
        this.prisma.db.rolePermission.deleteMany({ where: { roleId: dbRole.id } }),
        this.prisma.db.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: dbRole.id,
            permissionId: permission.id,
          })),
          skipDuplicates: true,
        }),
      ]);
    }

    this.logger.log('RBAC roles + permissions synced');
  }

  /** Fresh (Redis-cached) permission set for a set of roles. */
  async getPermissionsForRoles(roleCodes: RoleCode[]): Promise<Permission[]> {
    const result = new Set<Permission>();
    for (const code of roleCodes) {
      const cached = await this.redis.get<Permission[]>(cacheKey(code));
      if (cached) {
        cached.forEach((p) => result.add(p));
        continue;
      }
      const rows = await this.prisma.db.rolePermission.findMany({
        where: { role: { code } },
        include: { permission: { select: { code: true } } },
      });
      const permissions = rows.map((row) => row.permission.code as Permission);
      await this.redis.set(cacheKey(code), permissions, PERMS_CACHE_TTL_SECONDS);
      permissions.forEach((p) => result.add(p));
    }
    return [...result];
  }

  async invalidateRoleCache(roleCodes: RoleCode[]): Promise<void> {
    for (const code of roleCodes) await this.redis.del(cacheKey(code));
  }

  async assignRole(userId: string, roleCode: RoleCode): Promise<void> {
    const role = await this.prisma.db.role.findUnique({ where: { code: roleCode } });
    if (!role) throw new Error(`Role not found: ${roleCode}`);
    await this.prisma.db.userRole.upsert({
      where: { userId_roleId: { userId, roleId: role.id } },
      create: { userId, roleId: role.id },
      update: {},
    });
    // Any role change must take effect immediately: bump tokenVersion so already
    // issued access tokens (whose roleCodes are baked in) are rejected and the
    // user's next refresh re-reads the fresh role set.
    await this.prisma.db.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  /**
   * Org-scoped permission check used by Control Center endpoints. The
   * membership carries org-level `roleCodes` (distinct from the marketplace
   * `RoleCode` set). Global ADMINs always pass; org owners pass everything;
   * otherwise we map the membership's org role codes to the permission set.
   */
  async requireOrgPermission(
    membership: OrganizationMembershipLike,
    permission: Permission,
  ): Promise<void> {
    if (membership.roleCodes.includes('ORG_OWNER')) return;
    const granted = new Set<string>();
    for (const code of membership.roleCodes) {
      ORG_ROLE_PERMISSIONS[code]?.forEach((p) => granted.add(p));
    }
    if (!granted.has(permission)) {
      throw new ForbiddenException(`Missing organization permission: ${permission}`);
    }
  }

  memberHasOrgPermission(membership: OrganizationMembershipLike, permission: Permission): boolean {
    if (membership.roleCodes.includes('ORG_OWNER')) return true;
    const granted = new Set<string>();
    for (const code of membership.roleCodes) {
      ORG_ROLE_PERMISSIONS[code]?.forEach((p) => granted.add(p));
    }
    return granted.has(permission);
  }

  async getRolesForUser(userId: string): Promise<RoleCode[]> {
    const rows = await this.prisma.db.userRole.findMany({
      where: { userId },
      include: { role: { select: { code: true } } },
    });
    return rows.map((row) => row.role.code as RoleCode);
  }
}
