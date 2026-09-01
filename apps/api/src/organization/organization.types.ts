import type { Organization, OrganizationMembership } from '@prisma/client';
import { mediaUrl } from '../common/media-url';

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  status: string;
  plan: string;
  ownerId: string;
  createdAt: string;
}

export interface MembershipResponse {
  id: string;
  organizationId: string;
  userId: string;
  user: { id: string; name: string | null; email: string };
  roleCodes: string[];
  status: string;
  joinedAt: string;
}

export function toOrganizationResponse(org: Organization): OrganizationResponse {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    logoUrl: org.logoKey ? mediaUrl(org.logoKey) : null,
    status: org.status,
    plan: org.plan,
    ownerId: org.ownerId,
    createdAt: org.createdAt.toISOString(),
  };
}

export function toMembershipResponse(
  m: OrganizationMembership & { user?: { id: string; name: string | null; email: string } },
): MembershipResponse {
  return {
    id: m.id,
    organizationId: m.organizationId,
    userId: m.userId,
    user: m.user ?? { id: m.userId, name: null, email: '' },
    roleCodes: m.roleCodes,
    status: m.status,
    joinedAt: m.joinedAt.toISOString(),
  };
}
