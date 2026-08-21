import { SetMetadata } from '@nestjs/common';
import type { RoleCode } from '@nova/shared';

export const ROLES_KEY = 'roles';

/** Restrict a route to users holding at least one of the given roles. */
export const Roles = (...roles: RoleCode[]) => SetMetadata(ROLES_KEY, roles);
