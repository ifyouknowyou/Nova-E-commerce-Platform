'use client';

import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, BadgeCheck, RefreshCcw, ShieldCheck, Sparkles, Star, Truck } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { DepthCard, LayeredCard, Magnetic, ParallaxSection, Reveal3D, SceneContainer } from '@/components/3d';
import { HoverTiltCard } from '@/components/3d/hover-tilt-card';
import { NewsletterCard } from '@/components/3d/newsletter-card';
import { SectionHeading } from '@/components/3d/section-heading';
import { ProductCard } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { CategoryNode, PaginatedResult, ProductQuery, PublicBrand, PublicProduct } from '@/lib/api/types';

const TRUST = [
  { icon: ShieldCheck, title: 'Secure payments', text: 'PCI-compliant checkout.', accent: 'text-success' },
  { icon: Truck, title: 'Fast delivery', text: 'Reliable tracked shipping.', accent: 'text-primary' },
  { icon: RefreshCcw, title: 'Easy returns', text: '14-day return window.', accent: 'text-primary' },
  { icon: BadgeCheck, title: 'Verified sellers', text: 'Every store reviewed.', accent: 'text-warning' },
];

/** A product tile used inside the hero's floating 3D constellation. */
function HeroProductTile({
  product,
  className,
  large,
}: {
  product: PublicProduct;
  className?: string;
  large?: boolean;
}) {
  if (product.status && product.status !== 'APPROVED') return null;
  const img = product.images[0];
  return (
    <Link href={`/products/${product.slug}`} className={cn('group block', className)}>
      <div className="overflow-hidden rounded-2xl border bg-card text-card-foreground depth-3 hover-lift-lg">
        <div className={cn('relative overflow-hidden bg-muted', large ? 'aspect-[4/3]' : 'aspect-square')}>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img.url}
              alt={img.alt ?? product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
          )}
          {product.salePrice !== null && (
            <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
              Sale
            </span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground">{product.store.name}</p>
          <h3 className="mt-1 line-clamp-1 font-semibold">{product.name}</h3>
          <p className="mt-1 text-sm font-semibold text-primary">${product.effectivePrice.toFixed(2)}</p>
        </div>
      </div>
    </Link>
  );
}

/** A floating info chip at a given depth inside the hero scene. */
function HeroFloatChip({
  className,
  delay,
  enterDelay = 0,
  children,
}: {
  className?: string;
  delay?: string;
  enterDelay?: number;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={cn('absolute', className)}>
      <div
        className="animate-float-deep rounded-xl border bg-card/85 p-3 depth-2 backdrop-blur-md"
        style={delay ? { animationDelay: delay } : undefined}
      >
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24, delay: enterDelay }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

/** Live countdown to midnight — a real, non-fabricated urgency signal. */
function DealCountdown() {
  const reduce = useReducedMotion();
  const [left, setLeft] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      const s = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
      const h = String(Math.floor(s / 3600)).padStart(2, '0');
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const sec = String(s % 60).padStart(2, '0');
      setLeft(`${h}:${m}:${sec}`);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-foreground/90 backdrop-blur',
        reduce ? '' : 'animate-pulse',
      )}
    >
      <span className="relative flex h-2 w-2" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>
      Live · ends in <span className="font-mono tabular-nums">{left}</span>
    </span>
  );
}

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

  const bestSellers = useQuery({
    queryKey: ['home-best-sellers'],
    queryFn: () => apiFetch<PublicProduct[]>('/products/best-sellers'),
  });

  // Recently viewed — persisted in localStorage
  const [recentlyViewed, setRecentlyViewed] = useState<PublicProduct[]>([]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nova_recently_viewed');
      if (stored) setRecentlyViewed(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const featuredItems = featured.data?.items ?? [];
  const heroProduct = featuredItems.length > 0 ? featuredItems[0] : null;

  // Hero "fly-through": as the page scrolls away, the scene recedes and lifts.
  const heroRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 1.07]);
  const sceneRotateX = useTransform(scrollYProgress, [0, 1], [0, 5]);
  // Ambient depth haze — drifts slower than content for a parallax atmosphere.
  const pageScroll = useScroll();
  const hazeY = useTransform(pageScroll.scrollYProgress, [0, 1], [0, 160]);

  return (
    <div className="pb-16">
      {/* Ambient depth haze — fixed, drifts slower than content */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={reduce ? undefined : { y: hazeY }}
      >
        <div className="absolute -left-40 top-48 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-[130px]" />
        <div className="absolute -right-32 top-1/3 h-[26rem] w-[26rem] rounded-full bg-success/8 blur-[120px]" />
        <div className="absolute left-1/4 -bottom-24 h-[28rem] w-[28rem] rounded-full bg-primary/8 blur-[140px]" />
      </motion.div>

      {/* ========================= HERO — spatial scene ========================= */}
      <div ref={heroRef}>
      <SceneContainer grid aurora noise parallax={3} className="border-b bg-role-glow">
        <div className="page-container grid items-center gap-12 pb-20 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-20">
          <div className="relative z-10">
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium text-foreground/80 backdrop-blur-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Trusted multi-vendor marketplace
            </motion.p>
            <motion.h1
              initial={reduce ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="mt-4 text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
            >
              Discover products worth
              <span className="shimmer-text">
                {' '}loving
              </span>
            </motion.h1>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="mt-4 max-w-xl text-lg text-muted-foreground"
            >
              A premium marketplace of independent sellers — backed by secure payments,
              fast delivery, and easy returns. New drops every week.
            </motion.p>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <Magnetic strength={0.25}>
                <Button asChild size="lg" className="rounded-full btn-mesh">
                  <Link href="/products">
                    Shop now <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Magnetic>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link href="/deals">Today&apos;s deals</Link>
              </Button>
            </motion.div>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
              className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {TRUST.map((item) => (
                <DepthCard key={item.title} className="rounded-xl border bg-card/70 p-3 depth-1" glow>
                  <item.icon className={`h-5 w-5 ${item.accent}`} />
                  <p className="mt-2 text-xs font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{item.text}</p>
                </DepthCard>
              ))}
            </motion.div>
          </div>

          {/* 3D product constellation — recedes & lifts on scroll */}
          <motion.div
            className="relative hidden h-[540px] lg:block"
            style={{
              transformStyle: 'preserve-3d',
              ...(reduce ? {} : { y: sceneY, scale: sceneScale, rotateX: sceneRotateX }),
            }}
          >
            {/* Volumetric light rays */}
            <div aria-hidden className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="h-[32rem] w-[32rem] rounded-full bg-primary/5 blur-[80px]" />
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0%, var(--primary) 10%, transparent 20%, transparent 80%, var(--primary) 90%, transparent 100%)',
                  opacity: 0.06,
                }}
              />
            </div>
            <div aria-hidden className="animate-spin-slow absolute left-1/2 top-1/2 h-[31rem] w-[31rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary/15" />

            {heroProduct ? (
              <>
                <div className="tz-16 absolute left-1/2 top-1/2 w-[340px] -translate-x-1/2 -translate-y-1/2">
                  <div className="animate-float-deep">
                    <motion.div
                      initial={reduce ? false : { opacity: 0, y: 60, scale: 0.85 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.15 }}
                    >
                      <HeroProductTile product={heroProduct} large />
                    </motion.div>
                  </div>
                </div>

                {featuredItems[1] ? (
                  <div className="tz-60 absolute right-0 top-8 w-52 rotate-6">
                    <div className="animate-float-deep" style={{ animationDelay: '-4s' }}>
                      <motion.div
                        initial={reduce ? false : { opacity: 0, y: 60, scale: 0.85 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.3 }}
                      >
                        <HeroProductTile product={featuredItems[1]} />
                      </motion.div>
                    </div>
                  </div>
                ) : null}

                {featuredItems[2] ? (
                  <div className="tz-neg-32 absolute bottom-4 left-0 w-44 -rotate-6">
                    <div className="animate-float-deep" style={{ animationDelay: '-7s' }}>
                      <motion.div
                        initial={reduce ? false : { opacity: 0, y: 60, scale: 0.85 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 24, delay: 0.45 }}
                      >
                        <HeroProductTile product={featuredItems[2]} />
                      </motion.div>
                    </div>
                  </div>
                ) : null}

                <HeroFloatChip className="tz-40 left-0 top-24 w-44" delay="-2s" enterDelay={0.6}>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <div>
                      <p className="text-xs font-bold leading-none">{heroProduct.ratingAvg.toFixed(1)} rating</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">Top rated pick</p>
                    </div>
                  </div>
                </HeroFloatChip>

                <HeroFloatChip className="tz-24 right-0 bottom-16 w-44" delay="-5s" enterDelay={0.75}>
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs font-bold leading-none">Free shipping</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">Tracked, fast delivery</p>
                    </div>
                  </div>
                </HeroFloatChip>
              </>
            ) : (
              <Skeleton className="absolute left-1/2 top-1/2 h-80 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl" />
            )}
          </motion.div>
        </div>
      </SceneContainer>
      </div>

      {/* ========================= CATEGORIES ========================= */}
      {(categories.data?.length ?? 0) > 0 && (
        <Reveal3D delay={0.05}>
        <section className="page-container py-14">
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
            {categories.data!.slice(0, 6).map((cat, i) => (
              <Reveal3D key={cat.id} delay={i * 0.06} className="h-full">
              <HoverTiltCard maxTilt={7} className="h-full">
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
              </Reveal3D>
            ))}
          </div>
        </section>
        </Reveal3D>
      )}

      {/* ========================= TRENDING ========================= */}
      <Reveal3D delay={0.1}>
      <section className="page-container py-8">
        <SectionHeading
          kicker="Popular right now"
          title="Trending products"
          action={
            <Button asChild variant="ghost" size="sm">
              <Link href="/products?sort=popular">See all</Link>
            </Button>
          }
        />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
          {trending.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)
            : (trending.data?.items ?? []).map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>
      </Reveal3D>

      {/* ========================= FLASH DEALS ========================= */}
      {(deals.data?.items.length ?? 0) > 0 && (
        <Reveal3D delay={0.15}>
        <ParallaxSection distance={36}>
          <section className="page-container py-8">
          <div className="relative overflow-hidden rounded-3xl bg-role-glow p-6 sm:p-8">
            <div aria-hidden className="scene-grid" />
            <div className="relative">
            <SectionHeading
              kicker="Limited time"
              title="Flash deals"
              description="Grab these discounts before they're gone."
              action={
                <div className="flex flex-wrap items-center gap-3">
                  <DealCountdown />
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link href="/deals">View all deals</Link>
                  </Button>
                </div>
              }
            />
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
              {(deals.data?.items ?? []).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            </div>
          </div>
          </section>
        </ParallaxSection>
        </Reveal3D>
      )}

      {/* ========================= PROMO STRIP ========================= */}
      <Reveal3D delay={0.1}>
      <section className="page-container py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: 'Free shipping over $50', text: 'On eligible orders, automatically applied at checkout.', icon: Truck },
            { title: '14-day returns', text: 'Changed your mind? Send it back within two weeks.', icon: RefreshCcw },
            { title: 'Verified sellers only', text: 'Every store is vetted before it can list products.', icon: ShieldCheck },
          ].map((p) => (
            <LayeredCard key={p.title} className="p-5">
              <p.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{p.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.text}</p>
            </LayeredCard>
          ))}
        </div>
      </section>
      </Reveal3D>

      {/* ========================= BRANDS ========================= */}
      {(brands.data?.length ?? 0) > 0 && (
        <Reveal3D delay={0.1}>
        <section className="page-container py-8">
          <SectionHeading kicker="Trusted names" title="Popular brands" />
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {brands.data!
              .slice(0, 5)
              .map((brand, i) => (
                <div key={brand.id} className="animate-float-deep" style={{ animationDelay: `-${i * 1.3}s` }}>
                <Link
                  href={`/products?brandId=${brand.id}`}
                  className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 depth-1 transition-all hover:-translate-y-0.5 hover:bg-accent"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                    {brand.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{brand.name}</p>
                    <p className="text-[11px] text-muted-foreground">{brand.productCount} products</p>
                  </div>
                </Link>
                </div>
              ))}
          </div>
        </section>
        </Reveal3D>
      )}

      {/* ========================= RECOMMENDED ========================= */}
      <Reveal3D delay={0.15}>
      <section className="page-container py-8">
        <SectionHeading
          kicker="For you"
          title="Recommended for you"
          description="Top-rated picks our shoppers love right now."
        />
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
          {recommended.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-xl" />)
            : (recommended.data?.items ?? []).map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>
      </Reveal3D>

      {/* ========================= BEST SELLERS ========================= */}
      {(bestSellers.data?.length ?? 0) > 0 && (
        <Reveal3D delay={0.1}>
          <section className="page-container py-8">
            <SectionHeading
              kicker="Top sellers"
              title="Best Sellers"
              description="Our most popular products based on sales volume."
              action={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/products?sort=popular">See all</Link>
                </Button>
              }
            />
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {bestSellers.data!.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        </Reveal3D>
      )}

      {/* ========================= RECENTLY VIEWED ========================= */}
      {recentlyViewed.length > 0 && (
        <Reveal3D delay={0.1}>
          <section className="page-container py-8">
            <SectionHeading
              kicker="Your history"
              title="Recently Viewed"
              description="Products you've looked at recently."
            />
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {recentlyViewed.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        </Reveal3D>
      )}

      {/* ========================= NEWSLETTER ========================= */}
      <Reveal3D delay={0.1}>
      <section className="page-container py-8">
        <NewsletterCard />
      </section>
      </Reveal3D>
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