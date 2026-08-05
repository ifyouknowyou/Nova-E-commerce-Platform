'use client';

import { Star } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AddToCartButton } from './add-to-cart-button';
import { formatCurrency } from '@/lib/utils';
import type { PublicProduct } from '@/lib/api/types';

/** Lightweight quick-view dialog shown from a product card. */
export function QuickViewDialog({
  product,
  open,
  onOpenChange,
}: {
  product: PublicProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle className="sr-only">Quick view — {product.name}</DialogTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0].url}
                alt={product.images[0].alt ?? product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No image
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <p className="text-xs text-muted-foreground">{product.store.name}</p>
            <h3 className="mt-1 text-lg font-semibold leading-tight">{product.name}</h3>
            <div className="mt-1.5 flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium">{product.ratingAvg > 0 ? product.ratingAvg.toFixed(1) : '—'}</span>
              </span>
              <span className="text-muted-foreground">
                {product.reviewCount > 0 ? `${product.reviewCount} reviews` : 'No reviews'}
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xl font-bold">{formatCurrency(product.effectivePrice)}</span>
              {product.salePrice !== null && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(product.price)}
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </p>
            <div className="mt-auto space-y-2 pt-4">
              <AddToCartButton productId={product.id} stock={product.stock} className="w-full" />
              <a
                href={`/products/${product.slug}`}
                className="block w-full rounded-md border border-input bg-background px-4 py-2 text-center text-sm font-medium transition-colors hover:bg-accent"
              >
                View full details
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
