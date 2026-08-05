'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BadgeCheck, RefreshCcw, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import Link from 'next/link';
import { HoverTiltCard } from '@/components/3d/hover-tilt-card';
import { NewsletterCard } from '@/components/3d/newsletter-card';
import { SectionHeading } from '@/components/3d/section-heading';
import { ProductCard } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import type { CategoryNode, PaginatedResult, ProductQuery, PublicBrand, PublicProduct } from '@/lib/api/types';

const TRUST = [
  { icon: ShieldCheck, title: 'Secure payments', text: 'PCI-compliant checkout.', accent: 'text-success' },
  { icon: Truck, title: 'Fast delivery', text: 'Reliable tracked shipping.', accent: 'text-primary' },
  { icon: RefreshCcw, title: 'Easy returns', text: '14-day return window.', accent: 'text-primary' },
  { icon: BadgeCheck, title: 'Verified sellers', text: 'Every store reviewed.', accent: 'text-warning' },
];

function productsQuery(sort: ProductQuery['sort'], sale?: 'true', pageSize = 4): ProductQuery {
  return { page: 1, pageSize, sort, inStock: 'true', ...(sale ? { sale } : {}) };
}

function useProducts(query: ProductQuery, key: string) {
  return useQuery({
    queryKey: ['home', key, query],
    queryFn: () => apiFetch<PaginatedResult<PublicProduct>>(`/products?${toQuery(query)}`),
  });
}

export function Homepage() {
  const featured = useProducts({ ...productsQuery('rating'), sort: 'rating', pageSize: 4 }, 'featured');
  const trending = useProducts(productsQuery('popular', undefined, 8), 'trending');
  const deals = useProducts(productsQuery('popular', 'true', 4), 'deals');

  const categories = useQuery({
    queryKey: ['home-categories'],
    queryFn: () => apiFetch<CategoryNode[]>('/categories'),
  });
  const brands = useQuery({
    queryKey: ['home-brands'],
    queryFn: () => apiFetch<PublicBrand[]>('/brands'),
  });

  // No personalization endpoint exists; "Recommended" degrades to top-rated.
  const recommended = useProducts(productsQuery('rating', undefined, 4), 'recommended');

  const featuredItems = featured.data?.items ?? [];
  const heroProduct = featuredItems.length > 0 ? featuredItems[0] : null;

  return (
    <div className="pb-16">
      {/* ========================= HERO ========================= */}
      <section className="relative overflow-hidden bg-role-glow">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-foreground/80">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Trusted multi-vendor marketplace
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Discover products worth
              <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                {' '}loving
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              A premium marketplace of independent sellers — backed by secure payments,
              fast delivery, and easy returns. New drops every week.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link href="/products">
                  Shop now <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link href="/deals">Today&apos;s deals</Link>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TRUST.map((item) => (
                <div key={item.title} className="rounded-xl border bg-card/70 p-3 depth-1">
                  <item.icon className={`h-5 w-5 ${item.accent}`} />
                  <p className="mt-2 text-xs font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive product showcase */}
          <div className="hidden lg:block">
            {heroProduct ? (
              <HoverTiltCard maxTilt={8} className="mx-auto max-w-md">
                <Link href={`/products/${heroProduct.slug}`} className="block">
                  <div className="overflow-hidden rounded-2xl border bg-card depth-3">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      {heroProduct.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={heroProduct.images[0].url}
                          alt={heroProduct.images[0].alt ?? heroProduct.name}
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                          No image
                        </div>
                      )}
                      {heroProduct.salePrice !== null && (
                        <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
                          Sale
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground">{heroProduct.store.name}</p>
                      <h2 className="mt-1 line-clamp-1 font-semibold">{heroProduct.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Shop this featured product →
                      </p>
                    </div>
                  </div>
                </Link>
              </HoverTiltCard>
            ) : (
              <Skeleton className="h-80 w-full rounded-2xl" />
            )}
          </div>
        </div>
      </section>

      {/* ========================= CATEGORIES ========================= */}
      {(categories.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionHeading
            kicker="Browse"
            title="Shop by category"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link href="/products">View all</Link>
              </Button>
            }
          />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.data!.slice(0, 6).map((cat) => (
              <HoverTiltCard key={cat.id} maxTilt={7}>
                <Link
                  href={`/products?categoryId=${cat.id}`}
                  className="flex flex-col items-center rounded-2xl border bg-card p-4 text-center transition-colors hover:border-primary/40"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-xl font-bold text-primary">
                    {cat.name.charAt(0)}
                  </div>
                  <p className="mt-3 text-sm font-medium">{cat.name}</p>
                  {cat.children?.length ? (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{cat.children.length} subcategories</p>
                  ) : null}
                </Link>
              </HoverTiltCard>
            ))}
          </div>
        </section>
      )}

      {/* ========================= TRENDING ========================= */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="Popular right now"
          title="Trending products"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/products?sort=popular">See all</Link>
            </Button>
          }
        />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {trending.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)
            : (trending.data?.items ?? []).map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      {/* ========================= FLASH DEALS ========================= */}
      {(deals.data?.items.length ?? 0) > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-role-glow p-6 sm:p-8">
            <SectionHeading
              kicker="Limited time"
              title="Flash deals"
              description="Grab these discounts before they're gone."
              action={
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href="/deals">View all deals</Link>
                </Button>
              }
            />
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {(deals.data?.items ?? []).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================= PROMO STRIP ========================= */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: 'Free shipping over $50', text: 'On eligible orders, automatically applied at checkout.', icon: Truck },
            { title: '14-day returns', text: 'Changed your mind? Send it back within two weeks.', icon: RefreshCcw },
            { title: 'Verified sellers only', text: 'Every store is vetted before it can list products.', icon: ShieldCheck },
          ].map((p) => (
            <div key={p.title} className="group rounded-2xl border bg-card p-5 depth-1 transition-all hover:-translate-y-1">
              <p.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================= BRANDS ========================= */}
      {(brands.data?.length ?? 0) > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <SectionHeading kicker="Trusted names" title="Popular brands" />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {brands.data!
              .slice(0, 5)
              .map((brand) => (
                <Link
                  key={brand.id}
                  href={`/products?brandId=${brand.id}`}
                  className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-accent"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                    {brand.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{brand.name}</p>
                    <p className="text-[11px] text-muted-foreground">{brand.productCount} products</p>
                  </div>
                </Link>
              ))}
          </div>
        </section>
      )}

      {/* ========================= RECOMMENDED ========================= */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeading
          kicker="For you"
          title="Recommended for you"
          description="Top-rated picks our shoppers love right now."
        />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {recommended.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)
            : (recommended.data?.items ?? []).map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      {/* ========================= NEWSLETTER ========================= */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <NewsletterCard />
      </section>
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