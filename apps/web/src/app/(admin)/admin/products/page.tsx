'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/3d/page-header';
import { SpatialPanel } from '@/components/3d/spatial-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-permissions';
import { adminApi } from '@/lib/admin';
import { formatCurrency } from '@/lib/utils';

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('PENDING');
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<{ id: string; name: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');

  const { data, isLoading } = useQuery({ queryKey: ['admin-products', tab], queryFn: () => adminApi.products(tab) });
  const { has, ready } = usePermissions();

  const canModerate = ready && has('products:approve');
  const canDelete = ready && has('products:delete');
  const canAssign = ready && has('products:update');

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

  const assignProduct = useMutation({
    mutationFn: ({ id, categoryId, brandId }: { id: string; categoryId?: string; brandId?: string }) =>
      adminApi.assignProduct(id, { categoryId, brandId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Product category/brand updated');
      setAssignOpen(false);
      setSelectedCategory('');
      setSelectedBrand('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Open assign dialog for a product
  function openAssign(product: { id: string; name: string; category?: { id: string; name: string } | null; brand?: { id: string; name: string } | null }) {
    setAssignTarget(product);
    setSelectedCategory(product.category?.id ?? '');
    setSelectedBrand(product.brand?.id ?? '');
    setAssignOpen(true);
  }

  const categories = useQuery({ queryKey: ['admin-categories'], queryFn: () => adminApi.categories() });
  const brands = useQuery({ queryKey: ['admin-brands'], queryFn: () => adminApi.brands() });

  function handleSubmitAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!assignTarget) return;
    assignProduct.mutate({
      id: assignTarget.id,
      ...(selectedCategory ? { categoryId: selectedCategory } : {}),
      ...(selectedBrand ? { brandId: selectedBrand } : {}),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Product moderation" subtitle="Approve, reject, or assign category & brand to seller submissions" />

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
                <p className="text-xs text-muted-foreground">
                  Category: <span className="font-medium">{product.category?.name ?? <span className="text-warning">Unassigned</span>}</span>
                  {' · '}Brand: <span className="font-medium">{product.brand?.name ?? <span className="text-warning">Unassigned</span>}</span>
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
                {canAssign && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openAssign(product)}
                  >
                    Assign
                  </Button>
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

      {/* Assign Category/Brand Dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Category & Brand</DialogTitle>
            <DialogDescription>
              Set the product category and brand for &ldquo;{assignTarget?.name}&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitAssign}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="assign-category">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="assign-category">
                    <SelectValue placeholder="Select category…" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.isLoading ? (
                      <SelectItem value="_loading" disabled>Loading…</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="">— None —</SelectItem>
                        {categories.data?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign-brand">Brand</Label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger id="assign-brand">
                    <SelectValue placeholder="Select brand…" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.isLoading ? (
                      <SelectItem value="_loading" disabled>Loading…</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="">— None —</SelectItem>
                        {brands.data?.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setAssignOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={assignProduct.isPending}>
                {assignProduct.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
