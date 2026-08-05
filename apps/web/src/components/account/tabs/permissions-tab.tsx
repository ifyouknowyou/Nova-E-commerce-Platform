'use client';

import { useQuery } from '@tanstack/react-query';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usersApi } from '@/lib/profile';
import { cn } from '@/lib/utils';
import { ErrorState, SectionCard } from '../ui';

function moduleName(module: string): string {
  return module.charAt(0).toUpperCase() + module.slice(1);
}

export function PermissionsTab() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['permissions'],
    queryFn: usersApi.permissions,
  });

  if (isError) {
    return (
      <ErrorState
        description="We couldn't load your permissions."
        onRetry={() => void refetch()}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const permissions = data?.permissions ?? [];

  // Group permission codes by their module prefix (e.g. "products:read" → "products").
  const groups = new Map<string, string[]>();
  for (const code of permissions) {
    const [module, action] = code.split(':');
    if (!module) continue;
    const list = groups.get(module) ?? [];
    list.push(action ?? code);
    groups.set(module, list);
  }

  return (
    <SectionCard
      title="Your permissions"
      description="The access your roles grant across the platform. Managed by the platform RBAC system."
    >
      {permissions.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <KeyRound className="h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No permissions assigned.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {[...groups.entries()].map(([module, actions]) => (
            <div key={module} className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">{moduleName(module)}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {actions.map((action) => (
                  <Badge key={action} variant="secondary" className={cn('text-xs capitalize')}>
                    {action.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
