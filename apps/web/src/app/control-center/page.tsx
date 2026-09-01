'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Boxes,
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { BarChart3D } from '@/components/3d/charts';
import { KPI3DCard } from '@/components/3d/kpi-3d-card';
import { PageHeader } from '@/components/3d/page-header';
import { Reveal3D } from '@/components/3d/reveal-3d';
import { SpatialPanel } from '@/components/3d/spatial-panel';
import { Button } from '@/components/ui/button';
import { controlCenterApi, type CustomerSummary, type OrderSummary } from '@/lib/control-center';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default function ControlCenterOverviewPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['control-center', 'overview'],
    queryFn: () => controlCenterApi.overview(),
  });

  if (isError) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 p-8 text-center">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t load your Command Center. Make sure you belong to an organization.
        </p>
      </div>
    );
  }

  const kpis = data?.kpis;
  const trend = data?.salesTrend ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Commerce Command Center"
        subtitle="Real-time health across every store in your organization."
        actions={
          <Button asChild>
            <Link href="/control-center/analytics">View analytics</Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KPI3DCard
          label="Revenue (30d)"
          value={kpis?.revenue ?? 0}
          prefix="$"
          icon={DollarSign}
          tone="success"
          sub={isLoading ? 'Loading…' : 'Net of cancelled orders'}
        />
        <KPI3DCard
          label="Orders"
          value={kpis?.orders ?? 0}
          icon={ShoppingBag}
          tone="primary"
          sub={isLoading ? 'Loading…' : `Avg ${formatCurrency(kpis?.avgOrderValue ?? 0)}`}
        />
        <KPI3DCard
          label="Customers"
          value={kpis?.customers ?? 0}
          icon={Users}
          tone="primary"
          sub="Unique buyers"
        />
        <KPI3DCard
          label="Products"
          value={kpis?.products ?? 0}
          icon={Package}
          tone="primary"
        />
        <KPI3DCard
          label="Low stock"
          value={kpis?.lowStock ?? 0}
          icon={Boxes}
          tone="warning"
          sub="≤ 5 units"
        />
        <KPI3DCard
          label="Avg order value"
          value={kpis?.avgOrderValue ?? 0}
          prefix="$"
          icon={TrendingUp}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal3D className="lg:col-span-2">
          <SpatialPanel depth={4} spotlight className="p-6">
            <h2 className="text-lg font-semibold">Sales trend (last 30 days)</h2>
            <p className="mb-4 text-sm text-muted-foreground">Daily revenue and order count.</p>
            {trend.length > 0 ? (
              <BarChart3D
                data={trend.map((p) => ({ label: p.date.slice(5), value: p.revenue }))}
                height={220}
              />
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">No sales yet.</div>
            )}
          </SpatialPanel>
        </Reveal3D>

        <Reveal3D>
          <SpatialPanel depth={4} className="h-full p-6">
            <h2 className="text-lg font-semibold">Top products</h2>
            <p className="mb-4 text-sm text-muted-foreground">By revenue.</p>
            <ul className="space-y-3">
              {(data?.topProducts ?? []).map((p, i) => (
                <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                      {i + 1}
                    </span>
                    <span className="min-w-0 truncate">{p.name}</span>
                  </span>
                  <span className="font-medium">{formatCurrency(p.revenue)}</span>
                </li>
              ))}
              {(data?.topProducts ?? []).length === 0 && (
                <li className="text-sm text-muted-foreground">No sales yet.</li>
              )}
            </ul>
          </SpatialPanel>
        </Reveal3D>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SpatialPanel depth={3} className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent orders</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/control-center/orders">All orders</Link>
            </Button>
          </div>
          <RecentOrders orders={data?.recentOrders ?? []} loading={isLoading} />
        </SpatialPanel>

        <SpatialPanel depth={3} className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Top customers</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/control-center/customers">Directory</Link>
            </Button>
          </div>
          <TopCustomers customers={data?.recentCustomers ?? []} loading={isLoading} />
        </SpatialPanel>
      </div>
    </div>
  );
}

function RecentOrders({ orders, loading }: { orders: OrderSummary[]; loading: boolean }) {
  if (loading) return <Rows n={5} />;
  if (orders.length === 0) return <Empty label="No orders yet." />;
  return (
    <ul className="divide-y divide-border/60">
      {orders.map((o) => (
        <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <span className="min-w-0">
            <span className="block truncate font-medium">{o.email}</span>
            <span className="text-xs text-muted-foreground">{o.status}</span>
          </span>
          <span className="font-semibold">{formatCurrency(o.total)}</span>
        </li>
      ))}
    </ul>
  );
}

function TopCustomers({ customers, loading }: { customers: CustomerSummary[]; loading: boolean }) {
  if (loading) return <Rows n={5} />;
  if (customers.length === 0) return <Empty label="No customers yet." />;
  return (
    <ul className="divide-y divide-border/60">
      {customers.slice(0, 6).map((c) => (
        <li key={c.userId ?? c.email} className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <span className="min-w-0">
            <span className="block truncate font-medium">{c.name ?? c.email}</span>
            <span className="text-xs text-muted-foreground">{formatNumber(c.orders)} orders</span>
          </span>
          <span className="font-semibold">{formatCurrency(c.lifetimeValue)}</span>
        </li>
      ))}
    </ul>
  );
}

function Rows({ n }: { n: number }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: n }).map((_, i) => (
        <li key={i} className="h-9 animate-pulse rounded-md bg-muted/50" />
      ))}
    </ul>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{label}</p>;
}
