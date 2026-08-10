'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/3d/page-header';
import { SpatialPanel } from '@/components/3d/spatial-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-permissions';
import { adminApi } from '@/lib/admin';
import { formatDate } from '@/lib/utils';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['admin-users', q], queryFn: () => adminApi.users(q) });
  const { has, ready } = usePermissions();
  const canManageUsers = ready && has('users:manage');

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'SUSPENDED' | 'BANNED' }) => adminApi.setUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User status updated');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle="Manage customer, seller, and admin accounts"
        actions={
          <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {ready && !canManageUsers ? 'View only — no manage permission' : 'Management available'}
          </span>
        }
      />

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by email or name…"
        className="max-w-sm"
        aria-label="Search users"
      />

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <div className="space-y-3">
          {data?.items.map((user) => (
            <SpatialPanel key={user.id} depth={2} spotlight className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  {user.name ?? '—'} · {formatDate(user.createdAt)} · {user.roles.join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={user.status === 'ACTIVE' ? 'success' : 'destructive'} className="capitalize">
                  {user.status.toLowerCase()}
                </Badge>
                {canManageUsers && (user.status === 'ACTIVE' ? (
                  <Button size="sm" variant="outline" onClick={() => void setStatus.mutate({ id: user.id, status: 'SUSPENDED' })}>
                    Suspend
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => void setStatus.mutate({ id: user.id, status: 'ACTIVE' })}>
                    Activate
                  </Button>
                ))}
              </div>
            </SpatialPanel>
        ))}
        </div>
      )}
    </div>
  );
}