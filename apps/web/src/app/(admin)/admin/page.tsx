'use client';

import { useQuery } from '@tanstack/react-query';
import { DollarSign, Package, Receipt, ShieldCheck, ShoppingBag, Star, Store, Users } from 'lucide-react';
import Link from 'next/link';
import { KPI3DCard, type KPI3DCardProps } from '@/components/3d/kpi-3d-card';
import { PageHeader } from '@/components/3d/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { adminApi } from '@/lib/admin';

export default function AdminOverviewPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-overview'], queryFn: adminApi.overview });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  const stats: KPI3DCardProps[] = [
    { label: 'Platform revenue', value: data?.revenue ?? 0, prefix: '$', decimals: 2, icon: DollarSign },
    { label: 'Orders', value: data?.orders ?? 0, icon: Receipt, tone: 'success' },
    { label: 'Customers', value: data?.customers ?? 0, icon: Users },
    { label: 'Sellers', value: data?.sellers ?? 0, icon: Store },
    { label: 'Pending products', value: data?.pendingProducts ?? 0, icon: Package, tone: 'warning' },
    { label: 'Pending reviews', value: data?.pendingReviews ?? 0, icon: Star, tone: 'warning' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Command center" subtitle="Platform-wide metrics" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {stats.map((s) => (
          <KPI3DCard key={s.label} {...s} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <CardContent className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Product moderation</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {data && data.pendingProducts > 0
                      ? `${data.pendingProducts} product(s) awaiting review.`
                      : 'No products awaiting review right now.'}
                  </p>
                </div>
              </div>
              <Button asChild size="sm">
                <Link href="/admin/products">Open moderation</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardContent className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold">Reports</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Revenue, orders, inventory, and seller analytics.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/reports">View reports</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
