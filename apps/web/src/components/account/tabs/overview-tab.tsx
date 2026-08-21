'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Bell,
  Boxes,
  DollarSign,
  Heart,
  Package,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi } from '@/lib/admin';
import { notificationsApi } from '@/lib/notifications';
import { ordersApi } from '@/lib/orders';
import { sellerApi } from '@/lib/seller';
import { wishlistApi } from '@/lib/wishlist';
import { formatCurrency } from '@/lib/utils';
import type { UserProfile } from '@/lib/profile';
import { ErrorState, StatCard, StatSkeleton } from '../ui';

function QuickLinks({ roles }: { roles: string[] }) {
  const links: { href: string; label: string; icon: React.ElementType }[] = [];
  if (roles.includes('ADMIN')) links.push({ href: '/admin', label: 'Admin dashboard', icon: Users });
  if (roles.includes('SELLER')) links.push({ href: '/dashboard', label: 'Seller center', icon: Store });
  if (roles.includes('CUSTOMER')) {
    links.push({ href: '/account/orders', label: 'My orders', icon: ShoppingBag });
    links.push({ href: '/wishlist', label: 'Wishlist', icon: Heart });
  }
  links.push({ href: '/account/notifications', label: 'Notifications', icon: Bell });
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {links.map((link) => (
        <Button key={link.href} asChild variant="outline" className="h-auto justify-start gap-3 py-4">
          <Link href={link.href}>
            <link.icon className="h-5 w-5 text-muted-foreground" />
            {link.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}

function CustomerOverview() {
  const orders = useQuery({ queryKey: ['my-orders'], queryFn: ordersApi.list });
  const wishlist = useQuery({ queryKey: ['wishlist'], queryFn: wishlistApi.list });
  const unread = useQuery({ queryKey: ['notifications-unread'], queryFn: notificationsApi.unreadCount });

  if (orders.isError || wishlist.isError || unread.isError) {
    return (
      <ErrorState
        description="We couldn't load your account summary."
        onRetry={() => {
          void orders.refetch();
          void wishlist.refetch();
          void unread.refetch();
        }}
      />
    );
  }

  if (orders.isLoading || wishlist.isLoading || unread.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>
    );
  }

  const stats = [
    { icon: ShoppingBag, label: 'Orders', value: orders.data?.length ?? 0, sub: 'All time' },
    { icon: Heart, label: 'Wishlist', value: wishlist.data?.length ?? 0, sub: 'Saved items' },
    { icon: Bell, label: 'Unread', value: unread.data?.unread ?? 0, sub: 'Notifications' },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} sub={s.sub} />
      ))}
    </div>
  );
}

function SellerOverview() {
  const store = useQuery({ queryKey: ['my-store'], queryFn: sellerApi.getMyStore });
  const products = useQuery({ queryKey: ['seller-products', 1], queryFn: () => sellerApi.listProducts(1, 1) });
  const orders = useQuery({ queryKey: ['seller-orders', 1], queryFn: () => sellerApi.listOrders(1, 1) });
  const analytics = useQuery({ queryKey: ['seller-analytics'], queryFn: sellerApi.analytics });

  if (store.isError || products.isError || orders.isError || analytics.isError) {
    return (
      <ErrorState
        description="We couldn't load your store overview."
        onRetry={() => {
          void store.refetch();
          void products.refetch();
          void orders.refetch();
          void analytics.refetch();
        }}
      />
    );
  }

  if (store.isLoading || products.isLoading || orders.isLoading || analytics.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      </div>
    );
  }

  const analyticsData = analytics.data;

  return (
    <div className="space-y-4">
      {store.data ? (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div className="min-w-0">
              <p className="font-semibold">{store.data.name}</p>
              <p className="text-xs text-muted-foreground">
                /stores/{store.data.slug} · {store.data.status.toLowerCase()}
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/store">Manage store</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="font-semibold">No store yet</p>
              <p className="text-xs text-muted-foreground">Create a store to start selling.</p>
            </div>
            <Button asChild size="sm">
              <Link href="/sell">Open a store</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="Revenue" value={formatCurrency(analyticsData?.revenue ?? 0)} sub="Not including cancellations" />
        <StatCard icon={ShoppingBag} label="Orders" value={analyticsData?.orderCount ?? 0} sub="From your store" />
        <StatCard icon={Boxes} label="Products" value={products.data?.meta.totalItems ?? 0} sub="In your catalog" />
        <StatCard icon={TrendingUp} label="AOV" value={formatCurrency(analyticsData?.aov ?? 0)} sub="Average order value" />
      </div>
    </div>
  );
}

function AdminOverview() {
  const overview = useQuery({ queryKey: ['admin-overview'], queryFn: adminApi.overview });

  if (overview.isError) {
    return <ErrorState description="We couldn't load the platform overview." onRetry={() => void overview.refetch()} />;
  }

  if (overview.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    );
  }

  const data = overview.data;
  if (!data) return null;

  const stats = [
    { icon: DollarSign, label: 'Revenue', value: formatCurrency(data.revenue) },
    { icon: ShoppingBag, label: 'Orders', value: data.orders },
    { icon: Users, label: 'Customers', value: data.customers },
    { icon: Store, label: 'Sellers', value: data.sellers },
    { icon: Package, label: 'Pending products', value: data.pendingProducts },
    { icon: Bell, label: 'Pending reviews', value: data.pendingReviews },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((s) => (
        <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} />
      ))}
    </div>
  );
}

export function OverviewTab({ profile }: { profile: UserProfile }) {
  const primary = profile.roles.includes('ADMIN')
    ? 'admin'
    : profile.roles.includes('SELLER')
      ? 'seller'
      : 'customer';

  return (
    <div className="space-y-6">
      <QuickLinks roles={profile.roles} />
      {primary === 'admin' ? (
        <AdminOverview />
      ) : primary === 'seller' ? (
        <SellerOverview />
      ) : (
        <CustomerOverview />
      )}
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>
    </div>
  );
}
