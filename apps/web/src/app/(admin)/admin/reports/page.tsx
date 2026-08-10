'use client';

import { useQuery } from '@tanstack/react-query';
import { DollarSign, Package, Receipt, TrendingUp } from 'lucide-react';
import { BarChart3D, ChartContainer, DistributionBar, DonutRing, KPI3DCard, ProgressRow } from '@/components/3d';
import { PageHeader } from '@/components/3d/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { reportsApi } from '@/lib/reports';
import { formatCurrency, formatDate } from '@/lib/utils';

// Order lifecycle accents within the brand teal/cyan identity.
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'var(--warning)',
  CONFIRMED: 'oklch(0.62 0.12 205)',
  PROCESSING: 'oklch(0.7 0.14 180)',
  SHIPPED: 'oklch(0.56 0.13 245)',
  DELIVERED: 'var(--success)',
  CANCELLED: 'var(--danger)',
  REFUNDED: 'var(--muted-foreground)',
};

export default function AdminReportsPage() {
  const { data: sales } = useQuery({ queryKey: ['report-sales'], queryFn: () => reportsApi.sales() });
  const { data: revenue } = useQuery({ queryKey: ['report-revenue'], queryFn: () => reportsApi.revenue() });
  const { data: orderStatus } = useQuery({ queryKey: ['report-orders'], queryFn: () => reportsApi.orders() });
  const { data: customers } = useQuery({ queryKey: ['report-customers'], queryFn: () => reportsApi.customers() });
  const { data: sellers } = useQuery({ queryKey: ['report-sellers'], queryFn: () => reportsApi.sellers() });
  const { data: inventory } = useQuery({ queryKey: ['report-inventory'], queryFn: reportsApi.inventory });
  const { data: coupons } = useQuery({ queryKey: ['report-coupons'], queryFn: reportsApi.coupons });
  const { data: reviews } = useQuery({ queryKey: ['report-reviews'], queryFn: reportsApi.reviews });

  const maxCustomer = Math.max(1, ...(customers ?? []).map((c) => c.spent));

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Platform analytics for the last 30 days" />

      {/* KPI row — command panels */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI3DCard icon={DollarSign} label="Revenue" value={sales?.revenue ?? 0} prefix="$" decimals={2} />
        <KPI3DCard icon={Receipt} label="Orders" value={sales?.orders ?? 0} tone="success" />
        <KPI3DCard icon={Package} label="Items sold" value={sales?.items ?? 0} />
        <KPI3DCard icon={TrendingUp} label="Avg order value" value={sales?.averageOrderValue ?? 0} prefix="$" decimals={2} />
      </div>

      <Tabs defaultValue="revenue">
        <TabsList className="glass">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
          <TabsTrigger value="people">Customers & sellers</TabsTrigger>
          <TabsTrigger value="promo">Coupons & reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <ChartContainer title="Daily revenue" subtitle="Rolling 30-day performance">
            {revenue ? (
              <BarChart3D
                data={revenue.days.map((d) => ({ label: formatDate(d.date, { month: 'short', day: 'numeric' }), value: d.revenue }))}
                formatValue={(v) => formatCurrency(v)}
                height={240}
              />
            ) : (
              <Skeleton className="h-60 w-full" />
            )}
          </ChartContainer>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <ChartContainer title="Orders by status">
            {(orderStatus ?? []).length > 0 ? (
              <>
                <DistributionBar
                  segments={(orderStatus ?? []).map((row) => ({
                    label: row.status.toLowerCase(),
                    value: row.count,
                    color: STATUS_COLORS[row.status] ?? 'var(--primary)',
                  }))}
                />
                <div className="mt-6 divide-y">
                  {(orderStatus ?? []).map((row) => (
                    <div key={row.status} className="flex items-center justify-between py-2 text-sm">
                      <span className="capitalize text-muted-foreground">{row.status.toLowerCase()}</span>
                      <span className="font-medium">{row.count} · {formatCurrency(row.revenue)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">No order data yet.</p>
            )}
          </ChartContainer>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartContainer title="Inventory health">
              {inventory ? (
                <div className="flex items-center gap-6">
                  <DonutRing
                    value={inventory.healthy}
                    total={inventory.total || 1}
                    label="Healthy products"
                    color="var(--success)"
                  />
                  <div className="flex-1 space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Listed</span><span className="font-medium">{inventory.total}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Healthy</span><span className="font-medium">{inventory.healthy}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Low stock</span><span className="font-medium text-warning">{inventory.lowStock}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Out of stock</span><span className="font-medium text-danger">{inventory.outOfStock}</span></div>
                  </div>
                </div>
              ) : (
                <Skeleton className="h-40 w-full" />
              )}
            </ChartContainer>

            <ChartContainer title="Products by category">
              {(inventory?.byCategory.length ?? 0) > 0 ? (
                <BarChart3D
                  data={inventory!.byCategory.slice(0, 8).map((c) => ({ label: c.category, value: c.count }))}
                  height={200}
                />
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">No category data.</p>
              )}
            </ChartContainer>
          </div>
        </TabsContent>

        <TabsContent value="people" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartContainer title="Top customers by spend">
              {(customers ?? []).length > 0 ? (
                (customers ?? []).slice(0, 5).map((customer) => (
                  <ProgressRow
                    key={customer.customerId ?? 'x'}
                    label={customer.name ?? customer.email ?? 'Guest'}
                    value={customer.spent}
                    max={maxCustomer}
                    display={formatCurrency(customer.spent)}
                  />
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">No customer data.</p>
              )}
            </ChartContainer>
            <ChartContainer title="Top sellers">
              {(sellers ?? []).length > 0 ? (
                (sellers ?? []).slice(0, 5).map((seller) => (
                  <ProgressRow
                    key={seller.storeId}
                    label={seller.storeName ?? seller.storeId}
                    value={seller.sales}
                    max={Math.max(1, ...(sellers ?? []).slice(0, 5).map((s) => s.sales))}
                    display={formatCurrency(seller.sales)}
                  />
                ))
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">No seller data.</p>
              )}
            </ChartContainer>
          </div>
        </TabsContent>

        <TabsContent value="promo" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartContainer title="Coupon performance">
              {(coupons ?? []).slice(0, 5).map((coupon) => (
                <div key={coupon.id} className="flex items-center justify-between border-b py-2 text-sm last:border-0">
                  <span className="font-mono">{coupon.code}</span>
                  <span className="font-medium">{coupon.usedCount} uses · {formatCurrency(coupon.totalDiscount)}</span>
                </div>
              ))}
            </ChartContainer>
            <ChartContainer title="Reviews">
              <div className="flex items-center gap-6">
                <DonutRing value={reviews?.averageRating ?? 0} total={5} label="Average rating" color="var(--warning)" />
                <div className="flex-1 space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Average rating</span><span className="font-medium">{reviews?.averageRating ?? 0} / 5</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Approved</span><span className="font-medium text-success">{reviews?.approved ?? 0}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Pending</span><span className="font-medium text-warning">{reviews?.pending ?? 0}</span></div>
                </div>
              </div>
            </ChartContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

