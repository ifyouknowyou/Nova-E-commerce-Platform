'use client';

import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Store as StoreIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { sellerApi } from '@/lib/seller';
import { formatDate } from '@/lib/utils';
import { EmptyState, SectionCard } from '../ui';

const STORE_STATUS: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'border-transparent bg-success text-success-foreground' },
  PENDING: { label: 'Pending approval', className: 'border-transparent bg-warning text-warning-foreground' },
  SUSPENDED: { label: 'Suspended', className: 'border-transparent bg-danger text-danger-foreground' },
};

export function StoreTab() {
  const { data: store, isLoading } = useQuery({ queryKey: ['my-store'], queryFn: sellerApi.getMyStore });

  if (isLoading) {
    return <Skeleton className="h-44 w-full" />;
  }

  if (!store) {
    return (
      <EmptyState icon={StoreIcon} title="No store yet" description="Open a store to start selling on NOVA.">
        <Button asChild size="sm">
          <Link href="/sell">Open a store</Link>
        </Button>
      </EmptyState>
    );
  }

  const status = STORE_STATUS[store.status] ?? { label: store.status, className: '' };

  return (
    <SectionCard title="Store profile" description="How your store appears on the marketplace.">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          {store.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={store.logoUrl} alt={store.name} className="h-16 w-16 rounded-xl object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
              {store.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold">{store.name}</p>
              <Badge className={status.className}>{status.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">Opened {formatDate(store.createdAt)}</p>
            <Link
              href={`/stores/${store.slug}`}
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              /stores/{store.slug} <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {store.bio ? <p className="text-sm text-muted-foreground">{store.bio}</p> : null}

        <div className="rounded-lg border p-4">
          <p className="text-sm font-medium">Store tools</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage products, inventory, orders and coupons from the seller center.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/dashboard/store">Store settings</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/products">Products</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/orders">Orders</Link>
            </Button>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
