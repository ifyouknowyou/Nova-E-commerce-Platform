'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { ArrowRight, Boxes } from 'lucide-react';
import Link from 'next/link';
import { HoverTiltCard } from '@/components/3d/hover-tilt-card';
import { PageHeader } from '@/components/3d/page-header';
import { Reveal3D } from '@/components/3d/reveal-3d';
import { DepthCard } from '@/components/3d/depth-card';
import { apiFetch } from '@/lib/api';
import type { CategoryNode } from '@/lib/api/types';
import { cn } from '@/lib/utils';

export function CollectionsListing() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiFetch<CategoryNode[]>('/categories'),
  });

  // Flatten: show top-level categories, and if they have children, show them too
  const flatCategories = useMemo(() => {
    if (!categories) return [];
    const result: CategoryNode[] = [];
    for (const cat of categories) {
      result.push(cat);
      for (const child of cat.children) {
        result.push(child);
      }
    }
    return result;
  }, [categories]);

  if (isLoading) return <CollectionsSkeleton />;

  return (
    <div className="page-container py-8">
      <Reveal3D>
        <PageHeader
          title="Browse Collections"
          subtitle="Explore products by category — from electronics to fashion, find exactly what you need."
        />
      </Reveal3D>

      {flatCategories.length === 0 ? (
        <DepthCard className="flex flex-col items-center justify-center py-20 text-center">
          <Boxes className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium">No collections available yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Check back soon for new categories.</p>
        </DepthCard>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-4">
          {flatCategories.map((cat, index) => (
            <Reveal3D key={cat.id} delay={index * 0.05}>
              <HoverTiltCard maxTilt={6}>
                <Link
                  href={`/products?categoryId=${encodeURIComponent(cat.id)}`}
                  className="group block h-full"
                >
                  <DepthCard
                    level={2}
                    className={cn(
                      'flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:shadow-xl',
                      cat.parent ? 'pl-8' : '',
                    )}
                  >
                    {/* Image area */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-role-soft/30">
                      {cat.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={cat.imageUrl}
                          alt={cat.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Boxes className="h-10 w-10 text-primary/30" />
                        </div>
                      )}
                      {/* Category badge */}
                      <div className="absolute bottom-2 right-2 rounded-full bg-card/80 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground backdrop-blur-sm">
                        {cat._count?.products ?? '—'} items
                      </div>
                    </div>

                    {/* Text area */}
                    <div className="flex flex-1 items-center gap-2 px-4 py-3">
                      <span className={cn(
                        'flex-1 text-sm font-semibold',
                        cat.parent ? 'text-muted-foreground' : '',
                      )}>
                        {cat.name}
                      </span>
                      <ArrowRight className={cn(
                        'h-4 w-4 shrink-0 text-primary/50 transition-transform duration-300 group-hover:translate-x-0.5',
                        cat.parent ? 'opacity-0' : 'opacity-100',
                      )} />
                    </div>
                  </DepthCard>
                </Link>
              </HoverTiltCard>
            </Reveal3D>
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionsSkeleton() {
  return (
    <div className="page-container py-8">
      <div className="flex items-center gap-4">
        <div className="h-10 w-48 rounded-lg bg-muted" />
        <div className="h-4 w-64 rounded bg-muted" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[4/3] rounded-2xl bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
