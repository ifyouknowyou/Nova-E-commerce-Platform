'use client';

import { useQuery } from '@tanstack/react-query';
import { Bell, History, Package, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi } from '@/lib/admin';
import { notificationsApi } from '@/lib/notifications';
import { ordersApi } from '@/lib/orders';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { UserProfile } from '@/lib/profile';
import { EmptyState, ErrorState, SectionCard } from '../ui';

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'DELIVERED' || status === 'PAID' || status === 'APPROVED'
      ? 'success'
      : status === 'CANCELLED' || status === 'REJECTED' || status === 'FAILED'
        ? 'destructive'
        : 'secondary';
  return (
    <Badge variant={color as 'success' | 'destructive' | 'secondary'} className="capitalize">
      {status.toLowerCase()}
    </Badge>
  );
}

interface ActivityOrder {
  id: string;
  invoiceNumber: string | null;
  status: string;
  total: number;
  placedAt: string;
}

export function ActivityTab({ profile }: { profile: UserProfile }) {
  const isAdmin = profile.roles.includes('ADMIN');

  const orders = useQuery<ActivityOrder[]>({
    queryKey: isAdmin ? ['admin-orders', 1] : ['my-orders'],
    queryFn: async () => {
      if (isAdmin) {
        const result = await adminApi.orders(1);
        return result.items.map((order) => ({
          id: order.id,
          invoiceNumber: order.invoiceNumber,
          status: order.status,
          total: order.total,
          placedAt: order.placedAt,
        }));
      }
      return ordersApi.list();
    },
  });
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: () => notificationsApi.list(1, 10) });
  const auditLogs = useQuery({ queryKey: ['admin-audit-logs', 1], queryFn: () => adminApi.auditLogs(1), enabled: isAdmin });

  if (orders.isError) {
    return (
      <ErrorState
        description="We couldn't load your recent activity."
        onRetry={() => {
          void orders.refetch();
          void notifications.refetch();
          if (isAdmin) void auditLogs.refetch();
        }}
      />
    );
  }

  const loading = orders.isLoading || notifications.isLoading || (isAdmin && auditLogs.isLoading);
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const orderItems = orders.data ?? [];
  const notifItems = notifications.data?.items ?? [];
  const auditItems = isAdmin ? auditLogs.data?.items ?? [] : [];

  return (
    <div className="space-y-6">
      <SectionCard
        title="Recent orders"
        description="Your latest purchases."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href={isAdmin ? '/admin/orders' : '/account/orders'}>View all</Link>
          </Button>
        }
      >
        {orderItems.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No orders yet" />
        ) : (
          <div className="divide-y rounded-lg border">
            {orderItems.slice(0, 5).map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{order.invoiceNumber ?? order.id}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.placedAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={order.status} />
                  <span className="text-sm font-semibold">{formatCurrency(order.total)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Notifications"
        description="Recent account activity."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/account/notifications">View all</Link>
          </Button>
        }
      >
        {notifItems.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" />
        ) : (
          <div className="divide-y rounded-lg border">
            {notifItems.slice(0, 5).map((notification) => (
              <div key={notification.id} className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{notification.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{notification.message}</p>
                </div>
                <p className="shrink-0 text-xs text-muted-foreground">{formatDate(notification.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {isAdmin ? (
        <SectionCard title="Audit log" description="Recent platform actions by staff.">
          {auditItems.length === 0 ? (
            <EmptyState icon={History} title="No audit events yet" description="Security-sensitive actions are recorded here as they happen." />
          ) : (
            <div className="divide-y rounded-lg border">
              {auditItems.slice(0, 8).map((entry) => (
                <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-muted-foreground">{entry.action}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.email ?? 'system'} · {entry.entityType}
                      {entry.entityId ? ` · ${entry.entityId.slice(0, 8)}` : ''}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      ) : null}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Package className="h-3.5 w-3.5" />
        Only your real activity is shown here — no placeholder data.
      </div>
    </div>
  );
}
