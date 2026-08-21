import { SetMetadata } from '@nestjs/common';
import type { RoleCode } from '@nova/shared';

export const EXCLUDE_ROLES_KEY = 'excludeRoles';

/**
 * Forbid a route for users holding any of the given roles — regardless of what
 * other roles they hold. Used to keep administrators out of selling flows.
 */
export const ExcludeRoles = (...roles: RoleCode[]) => SetMetadata(EXCLUDE_ROLES_KEY, roles);