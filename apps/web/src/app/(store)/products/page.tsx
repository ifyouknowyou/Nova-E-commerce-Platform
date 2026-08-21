import { Suspense } from 'react';
import { ProductListing } from '@/components/product/product-listing';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Shop all products',
  description: 'Browse and filter thousands of products from verified sellers on NOVA Commerce.',
};

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const initial = {
    q: first(params.q) ?? '',
    categoryId: first(params.categoryId) ?? '',
    brandId: first(params.brandId) ?? '',
    minPrice: first(params.minPrice) ?? '',
    maxPrice: first(params.maxPrice) ?? '',
    sort: (first(params.sort) ?? 'newest') as 'newest' | 'popular' | 'price_asc' | 'price_desc' | 'rating',
    page: Number(first(params.page) ?? 1),
  };

  return (
    <Suspense fallback={<ListingSkeleton />}>
      <ProductListing initial={initial} />
    </Suspense>
  );
}

function ListingSkeleton() {
  return (
    <div className="page-container py-8">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <Skeleton className="hidden h-96 lg:block" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    </div>
  );
}
