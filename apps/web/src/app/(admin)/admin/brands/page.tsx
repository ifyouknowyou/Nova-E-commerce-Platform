'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/3d/page-header';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi, type AdminBrand, type BrandInput } from '@/lib/admin';

export default function AdminBrandsPage() {
  const queryClient = useQueryClient();
  const { data: brands, isLoading } = useQuery({ queryKey: ['admin-brands'], queryFn: adminApi.brands });

  const [editing, setEditing] = useState<AdminBrand | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-brands'] });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteBrand(id),
    onSuccess: () => {
      toast.success('Brand disabled');
      refresh();
    },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brands"
        subtitle="Manufacturers and labels in the catalog"
        actions={<Button onClick={() => setCreating(true)}>New brand</Button>}
      />

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (brands?.length ?? 0) === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No brands yet.</p>
      ) : (
        <div className="divide-y rounded-xl border">
          {brands!.map((brand) => (
            <div key={brand.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{brand.name}</p>
                  {!brand.isActive && <Badge variant="secondary">Disabled</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">/{brand.slug} · {brand.productCount} product(s)</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(brand)}>Edit</Button>
                {brand.isActive && (
                  <Button size="sm" variant="outline" className="text-danger" onClick={() => void remove.mutate(brand.id)}>
                    Disable
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <BrandDialog
          brand={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            toast.success(editing ? 'Brand updated' : 'Brand created');
            setCreating(false);
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function BrandDialog({ brand, onClose, onSaved }: { brand: AdminBrand | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = brand !== null;
  const [name, setName] = useState(brand?.name ?? '');
  const [slug, setSlug] = useState(brand?.slug ?? '');
  const [description, setDescription] = useState(brand?.description ?? '');
  const [isActive, setIsActive] = useState(brand?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const input: BrandInput = { name, slug: slug || undefined, description: description || undefined, isActive };
      if (isEdit && brand) await adminApi.updateBrand(brand.id, input);
      else await adminApi.createBrand(input);
      onSaved();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit brand' : 'New brand'}</DialogTitle>
          <DialogDescription>Brands appear on product pages and listings.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand-name">Name</Label>
            <Input id="brand-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-slug">Slug</Label>
            <Input id="brand-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand-desc">Description</Label>
            <Textarea id="brand-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="brand-active" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="brand-active">Active</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving || !name.trim()}>{saving ? 'Saving…' : 'Save'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
