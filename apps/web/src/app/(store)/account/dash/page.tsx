'use client';

import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Heart, Package, ShoppingCart, TrendingUp, Wallet } from 'lucide-react';
import Link from 'next/link';
import { KPI3DCard } from '@/components/3d/kpi-3d-card';
import { PageHeader } from '@/components/3d/page-header';
import { Reveal3D } from '@/components/3d/reveal-3d';
import { SpatialPanel } from '@/components/3d/spatial-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthenticated } from '@/hooks/use-auth';
import { ordersApi } from '@/lib/orders';
import { useWishlist } from '@/lib/wishlist';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

export default function CustomerDashboardPage() {
  const { authed, ready } = useAuthenticated();
  const { items: wishlistItems, isLoading: wishlistLoading } = useWishlist();
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: ordersApi.list,
    enabled: ready && authed,
  });

  if (!ready) return null;

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Sign in to view your dashboard</h1>
        <Button asChild className="mt-6">
          <Link href="/login?redirect=/account/dash">Sign in</Link>
        </Button>
      </div>
    );
  }

  const totalOrders = orders?.length ?? 0;
  const totalSpent = (orders ?? []).reduce((sum, o) => sum + o.total, 0);
  const recentOrders = (orders ?? []).slice(0, 5);

  return (
    <div className="page-container py-8">
      <Reveal3D>
        <PageHeader
          title="Your Dashboard"
          subtitle="Overview of your shopping activity"
        />
      </Reveal3D>

      {/* KPI Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Reveal3D delay={0.05}>
          <KPI3DCard
            icon={Package}
            label="Total Orders"
            value={ordersLoading ? 0 : totalOrders}
            tone="primary"
          />
        </Reveal3D>
        <Reveal3D delay={0.1}>
          <KPI3DCard
            icon={Wallet}
            label="Total Spent"
            value={ordersLoading ? 0 : totalSpent}
            prefix="$"
            decimals={2}
            tone="success"
          />
        </Reveal3D>
        <Reveal3D delay={0.15}>
          <KPI3DCard
            icon={Heart}
            label="Wishlist Items"
            value={wishlistLoading ? 0 : wishlistItems.length}
            tone="warning"
          />
        </Reveal3D>
        <Reveal3D delay={0.2}>
          <KPI3DCard
            icon={TrendingUp}
            label="Avg Order Value"
            value={totalOrders > 0 ? totalSpent / totalOrders : 0}
            prefix="$"
            decimals={2}
            tone="primary"
          />
        </Reveal3D>
      </div>

      {/* Recent Orders */}
      <Reveal3D delay={0.25}>
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">Recent Orders</h2>
            <Button asChild size="sm" variant="ghost">
              <Link href="/account/orders">View all</Link>
            </Button>
          </div>
          {ordersLoading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : recentOrders.length > 0 ? (
            <div className="mt-4 space-y-3">
              {recentOrders.map((order, i) => (
                <OrderRow key={order.id} order={order} index={i} />
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center rounded-xl border py-12 text-center">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">No orders yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Start shopping to see your orders here</p>
              <Button asChild className="mt-4">
                <Link href="/products">Browse products</Link>
              </Button>
            </div>
          )}
        </div>
      </Reveal3D>

      {/* Quick Actions */}
      <Reveal3D delay={0.3}>
        <div className="mt-8">
          <h2 className="text-lg font-bold tracking-tight">Quick Actions</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard
              href="/account/orders"
              icon={Package}
              title="My Orders"
              description="Track and manage"
            />
            <QuickActionCard
              href="/wishlist"
              icon={Heart}
              title="Wishlist"
              description={`${wishlistItems.length} items saved`}
            />
            <QuickActionCard
              href="/account/track"
              icon={CalendarDays}
              title="Track Orders"
              description="Shipping status"
            />
            <QuickActionCard
              href="/account/notifications"
              icon={TrendingUp}
              title="Notifications"
              description="Stay updated"
            />
          </div>
        </div>
      </Reveal3D>
    </div>
  );
}

function OrderRow({
  order,
  index,
}: {
  order: { id: string; invoiceNumber: string | null; status: string; total: number; placedAt: string; items: { name: string; quantity: number }[] };
  index: number;
}) {
  const statusColor = order.status === 'DELIVERED' || order.status === 'COMPLETED'
    ? 'bg-success/10 text-success'
    : order.status === 'SHIPPED' || order.status === 'CONFIRMED'
    ? 'bg-primary/10 text-primary'
    : order.status === 'CANCELLED'
    ? 'bg-danger/10 text-danger'
    : 'bg-warning/10 text-warning';

  return (
    <Reveal3D delay={0.05 * index}>
      <SpatialPanel depth={1} className="overflow-hidden">
        <CardContent className="flex items-center justify-between p-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{order.invoiceNumber ?? `Order #${order.id.slice(0, 8)}`}</span>
              <Badge variant="secondary" className={cn('capitalize', statusColor)}>
                {order.status.toLowerCase()}
              </Badge>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {order.items.map((item) => item.name).join(' · ')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{formatDate(order.placedAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-primary">{formatCurrency(order.total)}</p>
            <Button asChild size="sm" variant="ghost" className="mt-1 h-7 text-xs">
              <Link href={`/account/orders/${order.id}`}>View</Link>
            </Button>
          </div>
        </CardContent>
      </SpatialPanel>
    </Reveal3D>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Link href={href}>
      <SpatialPanel depth={1} className="h-full overflow-hidden transition-all hover:-translate-y-0.5">
        <CardContent className="flex flex-col gap-2 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </SpatialPanel>
    </Link>
  );
}
