'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { useAuthenticated } from '@/hooks/use-auth';
import { usersApi } from '@/lib/profile';

/**
 * Derives the active interface role (ADMIN > SELLER > CUSTOMER) from the
 * existing backend role data and exposes it via `data-role` on the document
 * root. The design system reads `data-role` to switch accent palettes, giving
 * each role a visually distinct interface without touching the backend.
 *
 * The `['profile']` query is already fetched by the header / RequireRole, so
 * this shares the same cache entry — it never issues an extra request.
 */
export function RoleThemeProvider({ children }: { children: ReactNode }) {
  const { authed, ready } = useAuthenticated();
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: usersApi.me,
    enabled: ready && authed,
    retry: false,
  });

  useEffect(() => {
    const root = document.documentElement;
    const roles = profile?.roles ?? [];
    const role = roles.includes('ADMIN') ? 'admin' : roles.includes('SELLER') ? 'seller' : 'customer';
    root.dataset.role = role;
    return () => {
      delete root.dataset.role;
    };
  }, [profile]);

  return <>{children}</>;
}
