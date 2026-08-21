'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/3d/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthenticated } from '@/hooks/use-auth';
import { notificationsApi } from '@/lib/notifications';
import { cn, formatDate } from '@/lib/utils';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { authed, ready } = useAuthenticated();
  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(1, 50),
    enabled: ready && authed,
  });

  const readAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  if (!ready) return null;

  if (!authed) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">Sign in to view notifications</h1>
        <Button asChild className="mt-6">
          <Link href="/login?redirect=/account/notifications">Sign in</Link>
        </Button>
      </div>
    );
  }

  const items = data?.items ?? [];
  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="py-8">
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread`}
        actions={
          unread > 0 ? (
            <Button size="sm" variant="outline" onClick={() => void readAll.mutate()}>
              Mark all read
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <div className="mt-6 space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-xl border py-16 text-center">
          <BellOff className="h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">You have no notifications.</p>
        </div>
      ) : (
        <div className="mt-6 divide-y rounded-xl border">
          {items.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => void markRead.mutate(notification.id)}
              className={cn(
                'flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-accent/40',
                !notification.isRead && 'bg-accent/20',
              )}
            >
              <Bell className={cn('mt-0.5 h-4 w-4 shrink-0', notification.isRead ? 'text-muted-foreground' : 'text-primary')} />
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm', !notification.isRead && 'font-semibold')}>{notification.title}</p>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(notification.createdAt)}</p>
              </div>
              {!notification.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
