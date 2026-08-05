import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DealsListing } from '@/components/product/deals-listing';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Deals',
  description:
    'Shop today’s best deals on NOVA Commerce — limited-time discounts on popular products from trusted sellers.',
};

export default function DealsPage() {
  return (
    <Suspense fallback={<DealsSkeleton />}>
      <DealsListing />
    </Suspense>
  );
}

function DealsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-56 rounded-2xl" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
