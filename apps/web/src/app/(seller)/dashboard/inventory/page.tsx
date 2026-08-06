'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Boxes, PackageX, TriangleAlert } from 'lucide-react';
import { KPI3DCard } from '@/components/3d/kpi-3d-card';
import { PageHeader } from '@/components/3d/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { sellerApi, type SellerProduct } from '@/lib/seller';
import { cn } from '@/lib/utils';

const LOW_STOCK_THRESHOLD = 5;

export default function SellerInventoryPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['seller-products'], queryFn: () => sellerApi.listProducts(1, 100) });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['seller-products'] });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      </div>
    );
  }

  const products = data?.items ?? [];
  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD);
  const outOfStock = products.filter((p) => p.stock === 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Inventory" subtitle="Monitor and adjust stock levels." />

      <div className="grid gap-4 sm:grid-cols-3">
        <KPI3DCard icon={Boxes} label="Total SKUs" value={products.length} />
        <KPI3DCard icon={TriangleAlert} label="Low stock" value={lowStock.length} tone="warning" />
        <KPI3DCard icon={PackageX} label="Out of stock" value={outOfStock.length} tone="danger" />
      </div>

      {products.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No products to track.</p>
      ) : (
        <div className="divide-y rounded-xl border">
          {products.map((product) => (
            <InventoryRow key={product.id} product={product} onSaved={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

function InventoryRow({ product, onSaved }: { product: SellerProduct; onSaved: () => void }) {
  const [stock, setStock] = useState(String(product.stock));
  const update = useMutation({
    mutationFn: () => sellerApi.updateInventory(product.id, Number(stock) || 0, LOW_STOCK_THRESHOLD),
    onSuccess: () => {
      toast.success('Stock updated');
      onSaved();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Update failed'),
  });

  const status = product.stock === 0 ? 'out' : product.stock <= LOW_STOCK_THRESHOLD ? 'low' : 'ok';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{product.name}</p>
        <p className="text-xs text-muted-foreground">{product.sku}</p>
        {/* Stock-level indicator */}
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                status === 'out' ? 'bg-danger' : status === 'low' ? 'bg-warning' : 'bg-success',
              )}
              style={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {product.stock} in stock{status === 'low' ? ' · reorder soon' : ''}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {status === 'out' && <Badge variant="destructive">Out of stock</Badge>}
        {status === 'low' && <Badge variant="warning">Low stock</Badge>}
        {status === 'ok' && <Badge variant="success">In stock</Badge>}
        <Input
          type="number"
          min="0"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className="h-8 w-20"
          aria-label={`Stock for ${product.name}`}
        />
        <Button size="sm" variant="outline" className="h-8" onClick={() => void update.mutate()} disabled={update.isPending}>
          {update.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Update
        </Button>
      </div>
    </div>
  );
}