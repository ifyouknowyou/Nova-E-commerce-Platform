'use client';

import { useQuery } from '@tanstack/react-query';
import { DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { BarChart3D, ChartContainer, KPI3DCard } from '@/components/3d';
import { PageHeader } from '@/components/3d/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { sellerApi } from '@/lib/seller';
import { formatCurrency } from '@/lib/utils';

export default function SellerAnalyticsPage() {
  const { data, isLoading } = useQuery({ queryKey: ['seller-analytics'], queryFn: sellerApi.analytics });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  const topProducts = data?.topProducts ?? [];
  const maxRevenue = Math.max(1, ...topProducts.map((p) => p.revenue));

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Store performance at a glance." />

      <div className="grid gap-4 sm:grid-cols-3">
        <KPI3DCard icon={DollarSign} label="Revenue" value={data?.revenue ?? 0} prefix="$" decimals={2} />
        <KPI3DCard icon={ShoppingBag} label="Orders" value={data?.orderCount ?? 0} tone="success" />
        <KPI3DCard icon={TrendingUp} label="Average order value" value={data?.aov ?? 0} prefix="$" decimals={2} />
      </div>

      <ChartContainer
        title="Revenue by top product"
        subtitle="Sales contribution from your best sellers"
      >
        {topProducts.length > 0 ? (
          <BarChart3D
            data={topProducts.slice(0, 8).map((p) => ({
              label: p.productId.slice(0, 8),
              value: p.revenue,
            }))}
            formatValue={(v) => formatCurrency(v)}
            height={240}
          />
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">No sales yet.</p>
        )}
      </ChartContainer>

      <ChartContainer title="Top products">
        {topProducts.length > 0 ? (
          <div className="divide-y">
            {topProducts.map((item) => (
              <div key={item.productId} className="flex items-center justify-between py-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.productId}</p>
                  <div className="mt-1 h-1.5 max-w-xs overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(item.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="ml-4 shrink-0 font-medium">
                  {item.sold} sold · {formatCurrency(item.revenue)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">No sales yet.</p>
        )}
      </ChartContainer>
    </div>
  );
}
