'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Percent, Sparkles, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/3d/page-header';
import { Reveal3D } from '@/components/3d/reveal-3d';
import { HoverTiltCard } from '@/components/3d/hover-tilt-card';
import { DepthCard } from '@/components/3d/depth-card';
import { SectionHeading } from '@/components/3d/section-heading';
import { ProductCard } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import type { PublicProduct } from '@/lib/api/types';

export default function DealsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => apiFetch<{ items: PublicProduct[]; meta: { totalItems: number } }>('/products?sale=true&limit=20'),
  });

  return (
    <div className="page-container py-8">
      <Reveal3D>
        <PageHeader
          title="Today's Deals"
          subtitle="Limited-time discounts on popular products from verified sellers"
        />
      </Reveal3D>

      {/* Promo Banner */}
      <Reveal3D delay={0.1}>
        <DepthCard level={2} glow className="mt-6 overflow-hidden rounded-2xl">
          <div className="relative flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-warning" />
                <span className="rounded-full bg-warning/10 px-3 py-0.5 text-xs font-semibold text-warning">
                  LIMITED TIME
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-bold">Flash Sale — Up to 50% Off</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Grab the best deals before they&apos;re gone. New deals added daily.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">Ends soon</span>
              </div>
            </div>
            <div className="shrink-0">
              <Link href="/products?sale=true">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg"
                >
                  Browse All Deals
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
            </div>
          </div>
          {/* Decorative gradient overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" aria-hidden />
        </DepthCard>
      </Reveal3D>

      {/* Stats Bar */}
      {!isLoading && data?.meta && (
        <Reveal3D delay={0.15}>
          <div className="mt-6 flex flex-wrap gap-3">
            <DepthCard level={1} className="flex items-center gap-2 px-4 py-2">
              <TrendingDown className="h-4 w-4 text-success" />
              <span className="text-sm font-medium">
                {data.meta.totalItems} deals available
              </span>
            </DepthCard>
            <DepthCard level={1} className="flex items-center gap-2 px-4 py-2">
              <Percent className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">Up to 50% off</span>
            </DepthCard>
          </div>
        </Reveal3D>
      )}

      {/* Product Grid */}
      <Reveal3D delay={0.2}>
        <SectionHeading
          kicker="Featured Deals"
          title="Hot Products"
          action={
            <Link href="/products?sale=true" className="flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
          className="mt-8"
        />
      </Reveal3D>

      {isLoading ? (
        <DealsSkeleton />
      ) : data?.items && data.items.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4 xl:grid-cols-4">
          {data.items.map((product, index) => (
            <Reveal3D key={product.id} delay={0.05 * index}>
              <HoverTiltCard maxTilt={5}>
                <ProductCard product={product} />
              </HoverTiltCard>
            </Reveal3D>
          ))}
        </div>
      ) : (
        <DepthCard level={2} className="flex flex-col items-center justify-center py-20 text-center">
          <Percent className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-lg font-medium">No deals available right now</p>
          <p className="mt-1 text-sm text-muted-foreground">Check back later for new discounts!</p>
          <Link href="/products">
            <Button className="mt-4" variant="outline">
              Browse All Products
            </Button>
          </Link>
        </DepthCard>
      )}
    </div>
  );
}

function DealsSkeleton() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:gap-4 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
