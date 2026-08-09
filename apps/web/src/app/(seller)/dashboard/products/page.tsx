'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image as ImageIcon, Loader2, Package, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/3d/page-header';
import { SpatialPanel } from '@/components/3d/spatial-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { sellerApi, type SellerProduct } from '@/lib/seller';

export default function SellerProductsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['seller-products'], queryFn: () => sellerApi.listProducts(1, 50) });

  const del = useMutation({
    mutationFn: (id: string) => sellerApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast.success('Product deleted');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Delete failed'),
  });

  const submit = useMutation({
    mutationFn: (id: string) => sellerApi.submitForReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast.success('Submitted for review');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Could not submit'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle="Manage your catalog and inventory"
        actions={<CreateProductButton />}
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center rounded-xl border py-12 text-center">
          <Package className="h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No products yet.</p>
          <CreateProductButton className="mt-4" />
        </div>
      ) : (
        <div className="space-y-3">
          {data!.items.map((product) => (
            <SpatialPanel key={product.id} depth={2} spotlight className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.sku} · {formatCurrency(product.price)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    product.status === 'APPROVED'
                      ? 'success'
                      : product.status === 'PENDING'
                        ? 'warning'
                        : product.status === 'REJECTED'
                          ? 'destructive'
                          : 'secondary'
                  }
                  className="capitalize"
                >
                  {product.status.toLowerCase()}
                </Badge>
                <span className="w-16 text-sm" title="Stock">{product.stock} in stock</span>
                {(product.status === 'DRAFT' || product.status === 'REJECTED') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void submit.mutate(product.id)}
                    disabled={submit.isPending}
                  >
                    Submit for review
                  </Button>
                )}
                <EditProduct product={product} />
                <ManageImages product={product} />
                <EditInventory product={product} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-danger"
                  aria-label={`Delete ${product.name}`}
                  onClick={() => void del.mutate(product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </SpatialPanel>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateProductButton({ className }: { className?: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => sellerApi.categories() });
  const create = useMutation({
    mutationFn: () =>
      sellerApi.createProduct({
        name,
        sku,
        price: Number(price),
        stock: Number(stock) || 0,
        categoryId: String(firstCategoryId(categories)),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      setOpen(false);
      setName(''); setSku(''); setPrice(''); setStock('');
      toast.success('Product submitted for review');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Create failed'),
  });

  return (
    <>
      <Button size="sm" className={className ?? ''} onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> Add product
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New product</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Product name" /></Field>
            <Field label="SKU"><Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU-001" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price ($)"><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min={0} /></Field>
              <Field label="Stock"><Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} min={0} /></Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!name.trim() || !sku.trim() || !price || create.isPending} onClick={() => void create.mutate()}>
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditProduct({ product }: { product: SellerProduct }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [releaseDate, setReleaseDate] = useState(
    product.releaseDate ? product.releaseDate.slice(0, 10) : '',
  );

  const storedRelease = product.releaseDate ? product.releaseDate.slice(0, 10) : '';
  const changed =
    name.trim() !== product.name ||
    Number(price) !== product.price ||
    releaseDate.trim() !== storedRelease;

  function close() {
    setOpen(false);
    setName(product.name);
    setPrice(String(product.price));
    setReleaseDate(storedRelease);
  }

  const update = useMutation({
    mutationFn: () =>
      sellerApi.updateProduct(product.id, {
        ...(name.trim() !== product.name ? { name: name.trim() } : {}),
        ...(Number(price) !== product.price ? { price: Number(price) } : {}),
        ...(releaseDate.trim() !== storedRelease
          ? { releaseDate: releaseDate.trim() ? new Date(releaseDate.trim()).toISOString() : null }
          : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      setOpen(false);
      toast.success('Product updated');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Update failed'),
  });

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="h-4 w-4" /> Edit
      </Button>
      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit product</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Field label="Name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={200}
                placeholder="Product name"
              />
            </Field>
            <Field label="SKU">
              <Input value={product.sku} readOnly aria-readonly="true" className="bg-muted/50 text-muted-foreground" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price ($)">
                <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min={0} />
              </Field>
              <Field label="Status">
                <Input
                  value={product.status}
                  readOnly
                  aria-readonly="true"
                  className="bg-muted/50 text-muted-foreground capitalize"
                />
              </Field>
            </div>
            <Field label="Release date (optional)">
              <Input
                type="date"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                aria-label="Release date"
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              Leave empty to make the product available immediately. A future date shows it as
              &quot;Coming soon&quot; on the storefront until the date passes.
            </p>
            {product.status === 'APPROVED' && (
              <p className="text-xs text-muted-foreground">
                Editing an approved product&apos;s name or price sends it back for admin review.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button
              disabled={!name.trim() || !price || Number(price) < 0 || !changed || update.isPending}
              onClick={() => void update.mutate()}
            >
              {update.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function EditInventory({ product }: { product: SellerProduct }) {
  const queryClient = useQueryClient();
  const [stock, setStock] = useState(String(product.stock));
  const update = useMutation({
    mutationFn: () => sellerApi.updateInventory(product.id, Number(stock), 5),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      toast.success('Inventory updated');
    },
  });

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
        className="h-8 w-20"
        aria-label={`Stock for ${product.name}`}
      />
      <Button size="sm" variant="outline" className="h-8" onClick={() => void update.mutate()} disabled={update.isPending}>
        Save
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function firstCategoryId(categories: unknown): string | undefined {
  const arr = categories as { id: string }[] | undefined;
  return arr && arr.length > 0 ? arr[0].id : undefined;
}

function ManageImages({ product }: { product: SellerProduct }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['seller-products'] });

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await sellerApi.uploadImage(file);
      await sellerApi.addProductImages(product.id, [{ key: uploaded.key, alt: product.name }]);
      invalidate();
      toast.success('Image added');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const setPrimary = useMutation({
    mutationFn: (imageId: string) => sellerApi.setPrimaryImage(product.id, imageId),
    onSuccess: () => {
      invalidate();
      toast.success('Primary image set');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed'),
  });

  const remove = useMutation({
    mutationFn: (imageId: string) => sellerApi.removeImage(product.id, imageId),
    onSuccess: () => {
      invalidate();
      toast.success('Image removed');
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed'),
  });

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <ImageIcon className="h-4 w-4" />
        Images
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Images — {product.name}</DialogTitle>
          </DialogHeader>
          {product.images.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {product.images.map((image) => (
                <div key={image.id}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt="" className="aspect-square w-full rounded-md border object-cover" />
                  <div className="mt-1 flex items-center gap-1">
                    {image.isPrimary ? (
                      <Badge variant="success">Primary</Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 flex-1 text-xs"
                        onClick={() => void setPrimary.mutate(image.id)}
                        disabled={setPrimary.isPending}
                      >
                        Set primary
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-danger"
                      aria-label="Remove image"
                      onClick={() => void remove.mutate(image.id)}
                      disabled={remove.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
              No images yet. Upload one below.
            </p>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => void handleFile(e)}
            aria-label="Upload product image"
          />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading…' : 'Upload image'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}