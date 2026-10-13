'use client';

import { Eye, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { HoverTiltCard } from '@/components/3d/hover-tilt-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { PublicProduct } from '@/lib/catalog-types';
import { cn } from '@/lib/utils';
import { QuickViewDialog } from './quick-view-dialog';

export function ProductCard({ product }: { product: PublicProduct }) {
  const primary = product.images[0];
  const secondary = product.images[1];
  const [quickOpen, setQuickOpen] = useState(false);

  const outOfStock = product.stock <= 0;

  // Never render removed/archived (or unapproved) products, even if a stale
  // cache still holds them. Missing status = pre-status API payload, show it.
  // Placed after the hooks so the Rules-of-Hooks hold.
  if (product.status && product.status !== 'APPROVED') return null;

  return (
    <>
      <HoverTiltCard maxTilt={5} className="h-full">
        <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card text-card-foreground transition-shadow duration-300 glow-ring hover:shadow-[0_20px_50px_-20px_var(--shadow-color)]">
          {/* Image */}
          <div
            className="spotlight relative aspect-square overflow-hidden bg-muted"
            onPointerMove={(e) => {
              const el = e.currentTarget;
              const r = el.getBoundingClientRect();
              el.style.setProperty('--spot-x', `${e.clientX - r.left}px`);
              el.style.setProperty('--spot-y', `${e.clientY - r.top}px`);
            }}
          >
            <Link href={`/products/${product.slug}`} className="block h-full w-full" aria-label={product.name}>
              {primary ? (
                <>
                  <Image
                    src={primary.url}
                    alt={primary.alt ?? product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    className={cn(
                      'object-cover transition-all duration-500 ease-out',
                      secondary && 'group-hover:scale-105 group-hover:opacity-0',
                    )}
                  />
                  {secondary && (
                    <Image
                      src={secondary.url}
                      alt={secondary.alt ?? `${product.name} alternate view`}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      className="absolute inset-0 scale-105 object-cover opacity-0 transition-all duration-500 ease-out group-hover:opacity-100"
                    />
                  )}
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
            </Link>

            {/* Badges */}
            <div className="absolute left-2 top-2 flex flex-col gap-1.5">
              {product.salePrice !== null && (
                <Badge variant="destructive" className="text-xs shadow">
                  Sale
                </Badge>
              )}
              {product.isFeatured && (
                <Badge variant="default" className="text-xs shadow">
                  Featured
                </Badge>
              )}
            </div>

            {/* Quick actions (visible on hover / focus-within) */}
            <div className="absolute right-2 top-2 flex flex-col gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full shadow"
                aria-label={`Quick view ${product.name}`}
                onClick={() => setQuickOpen(true)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>

            {/* Out of stock overlay */}
            {outOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
                <Badge variant="secondary">Out of stock</Badge>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="flex flex-1 flex-col p-4">
            <Link href={`/products/${product.slug}`} className="line-clamp-2 font-display text-base font-medium leading-snug hover:text-primary">
              {product.name}
            </Link>
            <p className="mt-0.5 text-xs text-muted-foreground">{product.store.name}</p>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-lg font-bold">{formatCurrency(product.effectivePrice)}</span>
                {product.salePrice !== null && (
                  <span className="text-xs text-muted-foreground line-through">{formatCurrency(product.price)}</span>
                )}
              </div>
              <span
                className="flex items-center gap-1 text-xs"
                aria-label={`Rated ${product.ratingAvg} out of 5`}
              >
                <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                {product.ratingAvg > 0 ? product.ratingAvg.toFixed(1) : '—'}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <Button variant="outline" size="lg" disabled className="h-9 flex-1 rounded-full text-xs">
                Catalog preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-full px-3 text-xs"
                aria-label={`Quick view ${product.name}`}
                onClick={() => setQuickOpen(true)}
              >
                Quick view
              </Button>
            </div>
          </div>
        </div>
      </HoverTiltCard>

      {quickOpen && (
        <QuickViewDialog
          product={product}
          open={quickOpen}
          onOpenChange={(o) => setQuickOpen(o)}
        />
      )}
    </>
  );
}