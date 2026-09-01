import {
  CanActivate,
  createParamDecorator,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../rbac/rbac.types';
import type { Organization, OrganizationMembership } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Injected by OrganizationGuard: the active tenant for the request. */
export interface OrgContext {
  organization: Organization;
  membership: OrganizationMembership;
  /** Org-scoped permission codes resolved from the membership roleCodes. */
  permissions: string[];
}

export const CurrentOrganization = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Organization => {
    const req = ctx.switchToHttp().getRequest<{ organization?: Organization }>();
    if (!req.organization) throw new ForbiddenException('No active organization context');
    return req.organization;
  },
);

export const CurrentMembership = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): OrganizationMembership => {
    const req = ctx.switchToHttp().getRequest<{ orgMembership?: OrganizationMembership }>();
    if (!req.orgMembership) throw new ForbiddenException('No active organization context');
    return req.orgMembership;
  },
);

/**
 * Resolves the active organization for a Control Center request. The org is
 * chosen by (in priority order): an `:organizationId` route param, an
 * `x-organization-id` header, or the user's first ACTIVE membership.
 *
 * Global ADMINs (marketplace super-admins) fall back to any org so they can
 * still operate the Control Center for support; their global `ADMIN` role is
 * what grants cross-tenant access at the RBAC layer.
 */
@Injectable()
export class OrganizationGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
      params?: { organizationId?: string };
      headers?: Record<string, string | undefined>;
      organization?: Organization;
      orgMembership?: OrganizationMembership;
    }>();

    const user = request.user;
    if (!user) return false;

    const requestedId = request.params?.organizationId ?? request.headers?.['x-organization-id'];
    const memberships = await this.prisma.db.organizationMembership.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { organization: true },
    });

    let chosen: (OrganizationMembership & { organization?: Organization }) | undefined =
      memberships.find((m) => m.organizationId === requestedId) ?? memberships[0];

    // Global admins can operate any org even without a direct membership.
    if (!chosen && user.roleCodes.includes('ADMIN')) {
      const org = requestedId
        ? await this.prisma.db.organization.findUnique({ where: { id: requestedId } })
        : await this.prisma.db.organization.findFirst({ where: { status: 'ACTIVE' } });
      if (org) {
        chosen = {
          id: 'admin',
          organizationId: org.id,
          userId: user.id,
          roleCodes: ['ORG_OWNER'],
          status: 'ACTIVE',
          invitedBy: null,
          joinedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as OrganizationMembership;
        (chosen as OrganizationMembership & { organization: Organization }).organization = org;
      }
    }

    if (!chosen) {
      // Not a fatal error on the list endpoint (it returns the empty list), but
      // any resource route must have a context.
      throw new ForbiddenException('You are not a member of any organization.');
    }

    const org =
      (chosen as OrganizationMembership & { organization?: Organization }).organization ??
      (await this.prisma.db.organization.findUnique({ where: { id: chosen.organizationId } }));
    if (!org) throw new ForbiddenException('Organization not found');

    request.organization = org;
    request.orgMembership = chosen;
    return true;
  }
}

/** Pipe that ensures a resolved org is ACTIVE (suspended orgs block writes). */
export class RequireActiveOrgPipe implements PipeTransform {
  transform(org: Organization, _metadata: unknown): Organization {
    if (org.status !== 'ACTIVE') throw new ForbiddenException('This organization is not active.');
    return org;
  }
}
