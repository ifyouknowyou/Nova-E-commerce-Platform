import { SessionClaim } from '@nexus/shared';
import { ApiException } from '../common/exceptions';

/**
 * Authenticated request principal — the verified access-token payload.
 * `orgId` is the tenant context that scopes every RLS query for this request.
 */
export interface AuthenticatedUser extends SessionClaim {
  email: string;
  emailVerified: boolean;
}

/** Pull the authenticated principal off the request, or throw if missing. */
export function requireUser(req: { user?: AuthenticatedUser }): AuthenticatedUser {
  if (!req.user) throw new ApiException('AUTH_UNAUTHENTICATED');
  return req.user;
}