'use client';

import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/3d/page-header';
import { DepthCard } from '@/components/3d/depth-card';
import { Reveal3D } from '@/components/3d/reveal-3d';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthenticated } from '@/hooks/use-auth';
import { ordersApi } from '@/lib/orders';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function MyOrdersPage() {
  const { authed, ready } = useAuthenticated();
  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: ordersApi.list,
    enabled: ready && authed,
  });

  if (!ready) return null;

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Sign in to view your orders</h1>
        <Button asChild className="mt-6">
          <Link href="/login?redirect=/account/orders">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="page-container py-8">
      <Reveal3D>
        <PageHeader
          title="My orders"
          subtitle="Everything you've purchased"
          actions={
            <Button asChild size="sm" variant="outline">
              <Link href="/account/track">Track orders</Link>
            </Button>
          }
        />
      </Reveal3D>

      {isLoading ? (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="mt-6 space-y-4">
          {orders.map((order, index) => (
            <Reveal3D key={order.id} delay={0.05 * index}>
              <DepthCard level={2} glow className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold tracking-tight">{order.invoiceNumber ?? order.id}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.placedAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="capitalize">{order.status.toLowerCase()}</Badge>
                      <span className="text-sm font-bold text-primary">{formatCurrency(order.total)}</span>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/account/orders/${order.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {order.items.map((item) => item.name).join(' · ')}
                  </p>
                </CardContent>
              </DepthCard>
            </Reveal3D>
          ))}
        </div>
      ) : (
        <Reveal3D delay={0.2}>
          <div className="mt-6 flex flex-col items-center rounded-xl border py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <ShoppingBag className="h-7 w-7 text-primary" />
            </div>
            <p className="mt-4 text-base font-semibold">No orders yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Start shopping to see your orders here</p>
            <Button asChild className="mt-5">
              <Link href="/products">Start shopping</Link>
            </Button>
          </div>
        </Reveal3D>
      )}
    </div>
  );
}