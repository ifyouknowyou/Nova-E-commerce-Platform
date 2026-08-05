'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Percent, SearchX } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ProductCard } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import type { PaginatedResult, ProductQuery, PublicProduct } from '@/lib/api/types';

const PAGE_SIZE = 12;

const SORTS: { value: NonNullable<NonNullable<ProductQuery['sort']>>; label: string }[] = [
  { value: 'popular', label: 'Most popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_desc', label: 'Biggest discount' },
  { value: 'rating', label: 'Top rated' },
];

export function DealsListing() {
  const [sort, setSort] = useState<ProductQuery['sort']>('popular');
  const [page, setPage] = useState(1);

  const query: ProductQuery = {
    page,
    pageSize: PAGE_SIZE,
    sort,
    sale: 'true',
    inStock: 'true',
  };

  const deals = useQuery({
    queryKey: ['deals', query],
    queryFn: () => apiFetch<PaginatedResult<PublicProduct>>(`/products?${toQuery(query)}`),
  });

  const totalPages = deals.data?.meta.totalPages ?? 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-role-glow p-8 text-card-foreground depth-2 sm:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Percent className="h-6 w-6 text-primary" />
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Today&apos;s deals</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Limited-time prices on popular products from verified sellers. Prices shown are the sale
          price — grab them before they&apos;re gone.
        </p>
        <p className="mt-4 inline-flex rounded-full border bg-background/60 px-3 py-1 text-sm font-medium text-foreground/80">
          {deals.isLoading ? 'Loading deals…' : `${deals.data?.meta.totalItems ?? 0} deals available`}
        </p>
      </div>

      {/* Toolbar */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {deals.data?.items.length ?? 0} shown
        </p>
        <Select value={sort} onValueChange={(v) => { setSort(v as ProductQuery['sort']); setPage(1); }}>
          <SelectTrigger className="w-48" aria-label="Sort deals">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div className="mt-6">
        {deals.isLoading ? (
          <GridSkeleton />
        ) : deals.data && deals.data.items.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {deals.data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border py-16 text-center">
            <SearchX className="h-10 w-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">No deals right now</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Check back soon — sellers add new discounts regularly.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/products">Browse all products</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function toQuery(q: ProductQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(q)) {
    if (value !== undefined && value !== '' && value !== null) params.set(key, String(value));
  }
  return params.toString();
}