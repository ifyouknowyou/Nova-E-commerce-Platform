'use client';

import { useQuery } from '@tanstack/react-query';
import { Package, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/3d/page-header';
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
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="My orders"
        subtitle="Everything you've purchased"
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href="/account/track">Track orders</Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden transition-shadow hover:depth-2">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{order.invoiceNumber ?? order.id}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.placedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="capitalize">{order.status.toLowerCase()}</Badge>
                    <span className="font-semibold">{formatCurrency(order.total)}</span>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/account/orders/${order.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {order.items.map((item) => item.name).join(' · ')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center rounded-xl border py-16 text-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No orders yet.</p>
          <Button asChild className="mt-4">
            <Link href="/products">Start shopping</Link>
          </Button>
        </div>
      )}
    </div>
  );
}