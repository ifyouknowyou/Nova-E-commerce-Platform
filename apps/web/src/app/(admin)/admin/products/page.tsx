'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/3d/page-header';
import { SpatialPanel } from '@/components/3d/spatial-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-permissions';
import { adminApi } from '@/lib/admin';
import { formatCurrency } from '@/lib/utils';

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('PENDING');
  const { data, isLoading } = useQuery({ queryKey: ['admin-products', tab], queryFn: () => adminApi.products(tab) });
  const { has, ready } = usePermissions();

  // Admin actions render only when the existing backend permission data allows.
  const canModerate = ready && has('products:approve');
  const canDelete = ready && has('products:delete');

  const moderate = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'APPROVED' | 'REJECTED' }) => adminApi.moderateProduct(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      toast.success('Product moderated');
    },
  });

  const removeProduct = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      toast.success('Product removed');
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Product moderation" subtitle="Approve or reject seller submissions" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="glass">
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No {tab.toLowerCase()} products.</p>
      ) : (
        <div className="space-y-3">
          {data!.items.map((product) => (
            <SpatialPanel key={product.id} depth={2} spotlight className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.store.name} · {formatCurrency(product.price)} · {product.stock} in stock
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">{product.status.toLowerCase()}</Badge>
                {product.status === 'PENDING' && canModerate && (
                  <>
                    <Button size="sm" onClick={() => void moderate.mutate({ id: product.id, status: 'APPROVED' })}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void moderate.mutate({ id: product.id, status: 'REJECTED' })}>
                      Reject
                    </Button>
                  </>
                )}
                {product.status === 'PENDING' && ready && !canModerate && (
                  <Badge variant="outline" className="text-xs">
                    No moderation permission
                  </Badge>
                )}
                {canDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-danger"
                    onClick={() => {
                      if (confirm(`Remove "${product.name}" from the marketplace? This cannot be undone.`)) {
                        void removeProduct.mutate(product.id);
                      }
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </SpatialPanel>
        ))}
        </div>
      )}
    </div>
  );
}