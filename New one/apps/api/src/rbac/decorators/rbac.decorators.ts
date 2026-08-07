import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'nexus:isPublic';
/** Mark a route as publicly accessible (skips auth). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const REQUIRED_PERMISSIONS_KEY = 'nexus:requiredPermissions';
/** Require the authenticated member hold ALL listed permission codes. */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);