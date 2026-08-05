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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi, type AdminCategory, type CategoryInput } from '@/lib/admin';

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useQuery({ queryKey: ['admin-categories'], queryFn: adminApi.categories });

  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
  };

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      toast.success('Category removed');
      refresh();
    },
    onError: (err) => toast.error((err as Error).message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        subtitle="Organize the product catalog"
        actions={<Button onClick={() => setCreating(true)}>New category</Button>}
      />

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : (categories?.length ?? 0) === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No categories yet.</p>
      ) : (
        <div className="divide-y rounded-xl border">
          {categories!.map((category) => (
            <div key={category.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{category.name}</p>
                  {!category.isActive && <Badge variant="secondary">Inactive</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  /{category.slug}
                  {category.parent && <> · parent: {category.parent.name}</>} · {category.productCount} product(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(category)}>
                  Edit
                </Button>
                <Button size="sm" variant="outline" className="text-danger" onClick={() => void remove.mutate(category.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <CategoryDialog
          category={editing}
          categories={categories ?? []}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            toast.success(editing ? 'Category updated' : 'Category created');
            setCreating(false);
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}

function CategoryDialog({
  category,
  categories,
  onClose,
  onSaved,
}: {
  category: AdminCategory | null;
  categories: AdminCategory[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = category !== null;
  const [name, setName] = useState(category?.name ?? '');
  const [slug, setSlug] = useState(category?.slug ?? '');
  const [parentId, setParentId] = useState(category?.parent?.id ?? 'none');
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  const parents = categories.filter((c) => c.id !== category?.id && !c.deletedAt);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const input: CategoryInput = {
        name,
        slug: slug || undefined,
        parentId: parentId === 'none' ? undefined : parentId,
        sortOrder: Number(sortOrder) || 0,
        isActive,
      };
      if (isEdit && category) await adminApi.updateCategory(category.id, input);
      else await adminApi.createCategory(input);
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
          <DialogTitle>{isEdit ? 'Edit category' : 'New category'}</DialogTitle>
          <DialogDescription>Categories can be nested under a parent.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input id="cat-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated" />
          </div>
          <div className="space-y-2">
            <Label>Parent category</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger><SelectValue placeholder="None (top level)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (top level)</SelectItem>
                {parents.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id}>{parent.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-sort">Sort order</Label>
            <Input id="cat-sort" type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="cat-active" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="cat-active">Active</Label>
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
