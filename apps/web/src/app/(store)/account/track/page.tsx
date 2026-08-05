'use client';

import { useQuery } from '@tanstack/react-query';
import { Check, Package, X } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/3d/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthenticated } from '@/hooks/use-auth';
import { ordersApi } from '@/lib/orders';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

const TRACK_STEPS = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'] as const;
const TERMINAL_STATUSES = new Set(['CANCELLED', 'RETURNED']);

function StatusStepper({ status }: { status: string }) {
  if (TERMINAL_STATUSES.has(status)) {
    const cancelled = status === 'CANCELLED';
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger/15 text-danger dark:bg-danger/25 dark:text-danger">
          {cancelled ? <X className="h-4 w-4" /> : <Package className="h-4 w-4" />}
        </div>
        <div>
          <p className="text-sm font-medium capitalize">{status.toLowerCase()}</p>
          <p className="text-xs text-muted-foreground">
            {cancelled ? 'This order was cancelled.' : 'This order was returned.'}
          </p>
        </div>
      </div>
    );
  }

  const current = TRACK_STEPS.indexOf(status as (typeof TRACK_STEPS)[number]);
  const reached = current === -1 ? 0 : current + 1;

  return (
    <div className="flex items-center" aria-label={`Order status: ${status.toLowerCase()}`}>
      {TRACK_STEPS.map((step, i) => {
        const done = i < reached;
        const active = i === reached - 1;
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors',
                  done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/30 bg-background text-muted-foreground',
                )}
              >
                {done ? <Check className="h-4 w-4" /> : <span className="text-xs">{i + 1}</span>}
              </div>
              <span
                className={cn(
                  'text-[11px] font-medium capitalize',
                  active ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.toLowerCase()}
              </span>
            </div>
            {i < TRACK_STEPS.length - 1 ? (
              <div
                className={cn(
                  'mx-1.5 h-0.5 w-6 sm:w-10',
                  i < reached - 1 ? 'bg-primary' : 'bg-muted-foreground/30',
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function TrackOrderPage() {
  const { authed, ready } = useAuthenticated();
  const { data: orders, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-orders'],
    queryFn: ordersApi.list,
    enabled: ready && authed,
  });

  if (!ready) return null;

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Sign in to track your orders</h1>
        <Button asChild className="mt-6">
          <Link href="/login?redirect=/account/track">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Track your order"
        subtitle="Live status for your recent orders. Open an order for the full timeline."
      />

      {isError ? (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-danger/30 bg-danger/10 py-12 text-center dark:border-danger/40 dark:bg-danger/15">
          <p className="text-sm font-medium">Could not load your orders</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : isLoading ? (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full" />
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden transition-shadow hover:depth-2">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{order.invoiceNumber ?? order.id}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.placedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatCurrency(order.total)}</span>
                    <Badge variant="secondary" className="capitalize">
                      {order.status.toLowerCase()}
                    </Badge>
                  </div>
                </div>

                <StatusStepper status={order.status} />

                <p className="truncate text-xs text-muted-foreground">
                  {order.items.map((item) => item.name).join(' · ')}
                </p>

                <div className="flex justify-end">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/account/orders/${order.id}`}>View tracking details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center rounded-xl border py-16 text-center">
          <Package className="h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No orders to track yet.</p>
          <Button asChild className="mt-4">
            <Link href="/products">Start shopping</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
