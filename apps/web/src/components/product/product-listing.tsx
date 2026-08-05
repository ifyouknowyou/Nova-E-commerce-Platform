'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/product/product-card';
import { apiFetch } from '@/lib/api';
import type { CategoryNode, PaginatedResult, ProductQuery, PublicBrand, PublicProduct } from '@/lib/api/types';

export interface ListingInitial {
  q: string;
  categoryId: string;
  brandId: string;
  minPrice: string;
  maxPrice: string;
  sort: NonNullable<ProductQuery['sort']>;
  page: number;
}

const SORTS: { value: NonNullable<ProductQuery['sort']>; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top rated' },
];

export function ProductListing({ initial }: { initial: ListingInitial }) {
  const router = useRouter();
  const [filters, setFilters] = useState(initial);
  const [qInput, setQInput] = useState(initial.q);

  const query: ProductQuery = useMemo(
    () => ({
      page: filters.page,
      pageSize: 12,
      q: filters.q || undefined,
      categoryId: filters.categoryId || undefined,
      brandId: filters.brandId || undefined,
      minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      sort: filters.sort,
      inStock: 'true',
    }),
    [filters],
  );

  const products = useQuery({
    queryKey: ['products', query],
    queryFn: () => apiFetch<PaginatedResult<PublicProduct>>(`/products?${toQuery(query)}`),
  });

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiFetch<CategoryNode[]>('/categories'),
  });
  const brands = useQuery({
    queryKey: ['brands'],
    queryFn: () => apiFetch<PublicBrand[]>('/brands'),
  });

  const apply = useCallback((patch: Partial<ListingInitial>, resetPage = true) => {
    // Keep the updater pure — navigation is a side effect and must not run
    // inside a state updater (StrictMode double-invokes updaters in dev and
    // calling router.replace there violates the render-purity contract).
    setFilters((prev) => ({ ...prev, ...patch, page: resetPage ? 1 : patch.page ?? prev.page }));
  }, []);

  // Mirror the current filters into the URL whenever they change.
  useEffect(() => {
    router.replace(`/products?${toQuery(queryFromFilters(filters))}`, { scroll: false });
  }, [filters, router]);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    apply({ q: qInput.trim(), page: 1 });
  };

  const totalPages = products.data?.meta.totalPages ?? 1;
  const activeCount = products.data?.items.length ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl border bg-role-soft p-6 depth-1">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Shop products</h1>
          <p className="text-sm text-muted-foreground">
            {products.isLoading
              ? 'Loading products…'
              : `${products.data?.meta.totalItems ?? 0} products`}
          </p>
        </div>
        <form onSubmit={submitSearch} className="relative mt-4 flex gap-2">
          <Input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search products…"
            className="max-w-sm"
            aria-label="Search products"
          />
          <Button type="submit" variant="outline" className="rounded-full">
            Search
          </Button>
        </form>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Filter sidebar */}
        <aside className="hidden space-y-6 lg:block" aria-label="Filters">
          <FilterSection title="Category">
            <div className="max-h-64 space-y-1 overflow-y-auto">
              <FilterOption
                label="All categories"
                active={!filters.categoryId}
                onClick={() => apply({ categoryId: '' })}
              />
              {categories.data?.map((category) => (
                <FilterOption
                  key={category.id}
                  label={category.name}
                  active={filters.categoryId === category.id}
                  onClick={() => apply({ categoryId: category.id })}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Brand">
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {brands.data?.map((brand) => (
                <FilterOption
                  key={brand.id}
                  label={brand.name}
                  active={filters.brandId === brand.id}
                  onClick={() => apply({ brandId: brand.id })}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Price">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={0}
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => apply({ minPrice: e.target.value })}
                aria-label="Minimum price"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="number"
                min={0}
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => apply({ maxPrice: e.target.value })}
                aria-label="Maximum price"
              />
            </div>
          </FilterSection>
        </aside>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{activeCount} shown</p>
            <Select
              value={filters.sort}
              onValueChange={(v) => apply({ sort: v as ListingInitial['sort'] })}
            >
              <SelectTrigger className="w-48" aria-label="Sort products">
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

          <Separator className="my-4" />

          {products.isLoading ? (
            <GridSkeleton />
          ) : products.data && products.data.items.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {products.data.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyResults onClear={() => apply({ q: '', categoryId: '', brandId: '', minPrice: '', maxPrice: '' })} />
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                disabled={filters.page <= 1}
                onClick={() => apply({ page: filters.page - 1 }, false)}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {filters.page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={filters.page >= totalPages}
                onClick={() => apply({ page: filters.page + 1 }, false)}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function FilterOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full truncate rounded px-2 py-1 text-left text-sm transition-colors ${
        active ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-accent'
      }`}
    >
      {label}
    </button>
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

function EmptyResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border py-16 text-center">
      <SearchX className="h-10 w-10 text-muted-foreground" />
      <h2 className="mt-4 text-lg font-semibold">No products found</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Try adjusting your search or filters.
      </p>
      <Button variant="outline" className="mt-4" onClick={onClear}>
        Clear all filters
      </Button>
    </div>
  );
}

function queryFromFilters(f: ListingInitial): ProductQuery {
  return {
    page: f.page,
    pageSize: 12,
    q: f.q || undefined,
    categoryId: f.categoryId || undefined,
    brandId: f.brandId || undefined,
    minPrice: f.minPrice ? Number(f.minPrice) : undefined,
    maxPrice: f.maxPrice ? Number(f.maxPrice) : undefined,
    sort: f.sort,
    inStock: 'true',
  };
}

function toQuery(q: ProductQuery): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(q)) {
    if (value !== undefined && value !== '' && value !== null) params.set(key, String(value));
  }
  return params.toString();
}
