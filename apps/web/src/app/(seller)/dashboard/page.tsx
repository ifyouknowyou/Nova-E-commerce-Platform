'use client';

import { useQuery } from '@tanstack/react-query';
import { DollarSign, Loader2, Plus, ShoppingBag, Store as StoreIcon, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { BarChart3D } from '@/components/3d/charts';
import { FloatingToolbar } from '@/components/3d/floating-toolbar';
import { KPI3DCard } from '@/components/3d/kpi-3d-card';
import { PageHeader } from '@/components/3d/page-header';
import { SpatialPanel } from '@/components/3d/spatial-panel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/auth';
import { sellerApi } from '@/lib/seller';
import { cn, formatCurrency } from '@/lib/utils';

export default function SellerDashboardPage() {
  const { data: store, isLoading } = useQuery({ queryKey: ['my-store'], queryFn: sellerApi.getMyStore });

  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;

  return store ? <Overview /> : <Onboarding />;
}

function Onboarding() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onboard(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setSubmitting(true);
    try {
      await sellerApi.createStore({ name });
      await authApi.refresh(); // pick up the newly-assigned SELLER role
      toast.success('Store created. Welcome as a seller!');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create store');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <Card className="overflow-hidden border bg-role-soft depth-2">
        <CardHeader className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <StoreIcon className="h-7 w-7 text-primary" />
          </span>
          <CardTitle className="text-xl">Open your store</CardTitle>
          <CardDescription>Give your store a name to start selling on NOVA.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void onboard(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">Store name</Label>
              <Input
                id="store-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your brand name"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting || !name.trim()}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Create store
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Overview() {
  const { data: store } = useQuery({ queryKey: ['my-store'], queryFn: sellerApi.getMyStore });
  const { data: products } = useQuery({
    queryKey: ['seller-products'],
    queryFn: () => sellerApi.listProducts(1, 50),
  });
  const { data: orders } = useQuery({
    queryKey: ['seller-orders'],
    queryFn: () => sellerApi.listOrders(1, 50),
  });
  const { data: analytics } = useQuery({
    queryKey: ['seller-analytics'],
    queryFn: sellerApi.analytics,
  });

  const topProducts = analytics?.topProducts ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={store ? `${store.name} · ${store.status.toLowerCase()}` : ''}
        actions={
          <Button asChild size="sm">
            <Link href="/dashboard/products">Add product</Link>
          </Button>
        }
      />

      {/* KPI row — dimensional panels */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI3DCard icon={DollarSign} label="Revenue" value={analytics?.revenue ?? 0} prefix="$" decimals={2} />
        <KPI3DCard icon={ShoppingBag} label="Orders" value={orders?.meta.totalItems ?? 0} tone="success" />
        <KPI3DCard icon={TrendingUp} label="Avg order value" value={analytics?.aov ?? 0} prefix="$" decimals={2} />
        <SpatialPanel depth={3} spotlight className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Store</p>
              <p
                className={cn(
                  'mt-2 font-display text-2xl font-bold tracking-tight capitalize',
                  store?.status === 'ACTIVE' ? 'text-success' : 'text-warning',
                )}
              >
                {store?.status.toLowerCase() ?? '—'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Storefront status</p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <StoreIcon className="h-5 w-5" />
            </div>
          </div>
        </SpatialPanel>
      </div>

      {/* Revenue chart */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <CardTitle className="text-base">Top products by revenue</CardTitle>
          {topProducts.length > 0 ? (
            <div className="mt-4">
              <BarChart3D
                data={topProducts.slice(0, 6).map((p) => ({
                  label: p.productId.slice(0, 8),
                  value: p.revenue,
                }))}
                formatValue={(v) => formatCurrency(v)}
                height={200}
              />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No sales yet.</p>
          )}
        </Card>

        <Card className="p-5">
          <CardTitle className="text-base">Top products</CardTitle>
          <ul className="mt-3 space-y-2">
            {topProducts.length > 0 ? (
              topProducts.slice(0, 5).map((item, i) => (
                <li key={item.productId} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="line-clamp-1 text-muted-foreground">{item.productId}</span>
                  </span>
                  <span className="flex shrink-0 gap-3 font-medium">
                    <span>{item.sold} sold</span>
                    <span className="text-muted-foreground">{formatCurrency(item.revenue)}</span>
                  </span>
                </li>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            )}
          </ul>
        </Card>
      </div>

      {/* Empty state */}
      {(products?.items.length ?? 0) === 0 && (
        <Card>
          <CardContent className="p-6">
            <CardTitle className="text-base">You have no products yet</CardTitle>
            <CardDescription className="mt-1">
              Add your first product to start selling.
            </CardDescription>
            <Button asChild className="mt-4">
              <Link href="/dashboard/products">Add product</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Floating quick actions */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-40 hidden lg:block">
        <FloatingToolbar>
          <Button asChild size="sm" variant="ghost" className="h-9 gap-1.5 rounded-full">
            <Link href="/dashboard/products">
              <Plus className="h-4 w-4" /> Add product
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost" className="h-9 gap-1.5 rounded-full">
            <Link href="/dashboard/store">
              <StoreIcon className="h-4 w-4" /> Store settings
            </Link>
          </Button>
        </FloatingToolbar>
      </div>
    </div>
  );
}
