import type { RoleCode } from '@nova/shared';

/** Shape attached to `request.user` by the JWT access strategy. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  roleCodes: RoleCode[];
}
