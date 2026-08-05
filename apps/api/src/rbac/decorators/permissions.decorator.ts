import { SetMetadata } from '@nestjs/common';
import type { Permission } from '@nova/shared';

export const PERMISSIONS_KEY = 'permissions';

/** Require ALL of the given permissions to access a route. */
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
