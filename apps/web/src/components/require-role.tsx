'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, ShieldX } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthenticated } from '@/hooks/use-auth';
import { usersApi } from '@/lib/profile';

interface RequireRoleProps {
  /** Role codes that may view the protected subtree. */
  roles: string[];
  /** Role codes that must NOT view the protected subtree (e.g. admins never sell). */
  excludeRoles?: string[];
  deniedTitle?: string;
  deniedMessage?: string;
  children: ReactNode;
}

/**
 * Frontend role gate for protected sections. Unauthenticated users are sent to
 * sign in (returning here afterwards); authenticated users without an allowed
 * role get a 403 screen. The API independently enforces the same rules.
 */
export function RequireRole({
  roles,
  excludeRoles = [],
  deniedTitle = 'Access denied',
  deniedMessage,
  children,
}: RequireRoleProps) {
  const pathname = usePathname();
  const { authed, ready } = useAuthenticated();
  const router = useRouter();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: usersApi.me,
    enabled: ready && authed,
    retry: false,
  });

  useEffect(() => {
    if (ready && !authed) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [ready, authed, router, pathname]);

  const userRoles = profile?.roles ?? [];
  const isExcluded = excludeRoles.some((role) => userRoles.includes(role));
  const allowed = !!profile?.roles?.some((role) => roles.includes(role)) && !isExcluded;

  if (!ready || (authed && isLoading)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authed) {
    // Redirect handled in the effect above.
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <ShieldX className="h-12 w-12 text-red-500" />
        <h1 className="mt-4 text-2xl font-bold">{deniedTitle}</h1>
        {deniedMessage && <p className="mt-2 text-sm text-muted-foreground">{deniedMessage}</p>}
        <Button asChild className="mt-6">
          <Link href="/">Back to the store</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
