import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CollectionsListing } from '@/components/collections/collections-listing';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Browse Collections — NOVA Commerce',
  description:
    'Explore curated product collections across categories on NOVA Commerce. Find exactly what you need.',
};

export default function CollectionsPage() {
  return (
    <Suspense fallback={<CollectionsSkeleton />}>
      <CollectionsListing />
    </Suspense>
  );
}

function CollectionsSkeleton() {
  return (
    <div className="page-container py-8">
      <Skeleton className="h-10 w-64" />
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
        ))}
      </div>
    </div>
  );
}
