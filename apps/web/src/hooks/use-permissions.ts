'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthenticated } from '@/hooks/use-auth';
import { usersApi } from '@/lib/profile';

/**
 * Reads the current administrator's permission codes from the existing backend
 * `/users/me/permissions` endpoint (shared query key `['permissions']`). Admin
 * actions are rendered/dispatched only when the authenticated admin holds the
 * relevant permission — the backend remains the final authorization layer.
 */
export function usePermissions() {
  const { authed, ready } = useAuthenticated();
  const { data, isLoading } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => usersApi.permissions(),
    enabled: ready && authed,
    retry: false,
  });

  const perms = data?.permissions ?? [];
  const has = (...codes: string[]): boolean => codes.every((c) => perms.includes(c));

  return { permissions: perms, has, isLoading, ready: ready && authed };
}