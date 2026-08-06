'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Store } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/3d/page-header';
import { SpatialPanel } from '@/components/3d/spatial-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-permissions';
import { adminApi } from '@/lib/admin';
import { formatDate } from '@/lib/utils';

interface SellerRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  commissionRate: number;
  seller: { id: string; email: string; name: string | null; status: string };
  productCount: number;
  orderCount: number;
  createdAt: string;
}

const STATUS_VARIANT: Record<string, 'success' | 'secondary' | 'warning' | 'destructive'> = {
  ACTIVE: 'success',
  PENDING: 'warning',
  SUSPENDED: 'destructive',
};

export default function AdminSellersPage() {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<SellerRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-sellers'],
    queryFn: () => adminApi.sellers(1),
  });
  const { has, ready } = usePermissions();
  const canManageSellers = ready && has('sellers:manage');

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
  };

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'SUSPENDED' }) => adminApi.setSellerStatus(id, status),
    onSuccess: () => {
      invalidate();
      toast.success('Seller status updated');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not update seller'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteSeller(id),
    onSuccess: () => {
      setDeleting(null);
      invalidate();
      toast.success('Seller removed from the marketplace');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not remove seller'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sellers"
        subtitle="Stores and their operators. Admins moderate — they do not sell."
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="space-y-3">
          {data.items.map((store) => (
            <SpatialPanel key={store.id} depth={2} spotlight>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{store.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {store.seller.email} · {store.seller.name ?? 'No name'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-muted-foreground">
                    {store.productCount} products · {store.orderCount} orders
                  </span>
                  <Badge variant={STATUS_VARIANT[store.status] ?? 'secondary'} className="capitalize">
                    {store.status.toLowerCase()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(store.createdAt)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canManageSellers && (store.status === 'ACTIVE' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void setStatus.mutate({ id: store.id, status: 'SUSPENDED' })}
                      disabled={setStatus.isPending}
                    >
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void setStatus.mutate({ id: store.id, status: 'ACTIVE' })}
                      disabled={setStatus.isPending}
                    >
                      Approve
                    </Button>
                  ))}
                  {canManageSellers && (
                    <Button size="sm" variant="outline" className="text-danger" onClick={() => setDeleting(store)}>
                      Delete
                    </Button>
                  )}
                </div>
              </CardContent>
            </SpatialPanel>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border py-16 text-center text-muted-foreground">No sellers yet.</p>
      )}

      {/* Delete confirmation */}
      {deleting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Remove this seller?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              <strong>{deleting.name}</strong> ({deleting.seller.email}) will be removed from the marketplace.
              Their storefront and listings will no longer be visible.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleting(null)} disabled={remove.isPending}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => void remove.mutate(deleting.id)} disabled={remove.isPending}>
                {remove.isPending ? 'Removing…' : 'Remove seller'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
