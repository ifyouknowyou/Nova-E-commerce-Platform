import { Star, Truck, ShieldCheck, RefreshCw, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import { ProductGallery } from '@/components/product/product-gallery';
import { PurchasePanel } from '@/components/product/purchase-panel';
import { ReviewsSection } from '@/components/product/reviews-section';
import { DepthCard } from '@/components/3d/depth-card';
import { SpatialPanel } from '@/components/3d/spatial-panel';
import { Reveal3D } from '@/components/3d/reveal-3d';
import { HoverTiltCard } from '@/components/3d/hover-tilt-card';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { JsonLd } from '@/components/seo/json-ld';
import { Separator } from '@/components/ui/separator';
import { apiFetch } from '@/lib/api';
import type { PublicProduct } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { notFound } from 'next/navigation';
import { RecentlyViewedTracker } from '@/components/product/recently-viewed-tracker';

// Public, infrequently-changing content — incremental static regeneration keeps
// TTFB low while staying within ~60s of price/stock changes.
export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string): Promise<PublicProduct> {
  const product = await apiFetch<PublicProduct>('/products/' + encodeURIComponent(slug));
  if (!product) throw new Error('Not found');
  return product;
}

async function getRelatedProducts(categoryId: string, productId: string): Promise<PublicProduct[]> {
  const result = await apiFetch<{ items: PublicProduct[] }>(
    `/products?categoryId=${encodeURIComponent(categoryId)}&pageSize=8`,
  );
  return (result.items ?? []).filter((p) => p.id !== productId);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let product: PublicProduct;
  try {
    product = await getProduct(slug);
  } catch {
    return { title: 'Product not found' };
  }

  const primaryImage = product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url;
  const description =
    product.description?.slice(0, 160) ??
    `Shop ${product.name} from ${product.store.name} on NOVA Commerce.`;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: 'website',
      title: product.name,
      description,
      url: `/products/${product.slug}`,
      images: primaryImage ? [{ url: primaryImage, alt: product.name }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: primaryImage ? [primaryImage] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  let product: PublicProduct;
  let related: PublicProduct[] = [];

  try {
    product = await getProduct(slug);
    related = await getRelatedProducts(product.category.id, product.id);
  } catch {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const primaryImage = product.images.find((i) => i.isPrimary)?.url ?? product.images[0]?.url;
  const breadcrumbItems = [
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Products', url: `${siteUrl}/products` },
    ...(product.category
      ? [{ name: product.category.name, url: `${siteUrl}/products?categoryId=${product.category.id}` }]
      : []),
    { name: product.name, url: `${siteUrl}/products/${product.slug}` },
  ];

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    sku: product.sku,
    image: product.images.map((i) => i.url).filter(Boolean),
    url: `${siteUrl}/products/${product.slug}`,
    brand: product.brand ? { '@type': 'Brand', name: product.brand.name } : undefined,
    offers: {
      '@type': 'Offer',
      price: product.effectivePrice,
      priceCurrency: 'USD',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${siteUrl}/products/${product.slug}`,
      seller: { '@type': 'Organization', name: product.store.name },
    },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.ratingAvg,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <>
      <JsonLd data={productLd} />
      <JsonLd data={breadcrumbLd} />
      <RecentlyViewedTracker product={product} />
      <div className="page-container py-8">
      <Reveal3D>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            ...(product.category ? [{ label: product.category.name, href: `/products?categoryId=${product.category.id}` }] : []),
            { label: product.name, href: `/products/${product.slug}` },
          ]}
        />
      </Reveal3D>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Product Gallery */}
        <Reveal3D delay={0.1}>
          <div>
            <ProductGallery product={product} />

            {/* Product title and basic info */}
            <Reveal3D delay={0.2}>
              <div className="mt-6">
                <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sold by <Link href={`/stores/${product.store.slug}`} className="text-primary hover:underline">{product.store.name}</Link>
                  {product.brand ? ` · ${product.brand.name}` : ''}
                </p>

                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn('h-4 w-4', i < Math.round(product.ratingAvg) ? 'fill-warning text-warning' : 'text-muted')}
                      />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {product.ratingAvg.toFixed(1)} ({product.reviewCount} reviews)
                    </span>
                  </div>
                  <span className={cn(
                    'rounded-full px-3 py-0.5 text-xs font-semibold',
                    product.stock > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger',
                  )}>
                    {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                  </span>
                </div>
              </div>
            </Reveal3D>

            <Separator className="my-6" />

            {/* Product features */}
            <Reveal3D delay={0.3}>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Truck, label: 'Free Shipping', desc: 'On orders over $50' },
                  { icon: ShieldCheck, label: 'Secure Payment', desc: '100% protected' },
                  { icon: RefreshCw, label: 'Easy Returns', desc: '14-day policy' },
                  { icon: Package, label: 'Fast Delivery', desc: '3-7 business days' },
                ].map((item, i) => (
                  <DepthCard key={i} level={1} className="flex items-center gap-3 p-3">
                    <item.icon className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </DepthCard>
                ))}
              </div>
            </Reveal3D>
          </div>
        </Reveal3D>

        {/* Purchase Panel */}
        <Reveal3D delay={0.15}>
          <PurchasePanel product={product} />
        </Reveal3D>
      </div>

      {/* Product Description */}
      {product.description && (
        <Reveal3D delay={0.2} className="mt-10">
          <Section3D title="Product Details" subtitle="Complete specification and description">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description}</p>
          </Section3D>
        </Reveal3D>
      )}

      {/* Reviews Section */}
      <Reveal3D delay={0.3}>
        <div className="mt-10">
          <ReviewsSection productId={product.id} />
        </div>
      </Reveal3D>

      {/* Related Products */}
      {related.length > 0 && (
        <Reveal3D delay={0.4}>
          <section className="mt-12">
            <Section3D title="Related Products" subtitle="You might also like">
              <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                {related.map((item, i) => (
                  <Reveal3D key={item.id} delay={i * 0.05}>
                    <Link href={`/products/${item.slug}`}>
                      <HoverTiltCard maxTilt={5}>
                        <div className="overflow-hidden rounded-xl border bg-card">
                          <div className="relative aspect-square overflow-hidden bg-role-soft/20">
                            {item.images[0]?.url ? (
                              <Image
                                src={item.images[0].url}
                                alt={item.name}
                                fill
                                sizes="(max-width: 768px) 50vw, 25vw"
                                className="object-cover transition-transform duration-500 hover:scale-110"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-8 w-8 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                            <p className="mt-1 text-sm font-bold text-primary">
                              {formatPrice(item.effectivePrice)}
                            </p>
                            <div className="mt-1 flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, si) => (
                                <Star
                                  key={si}
                                  className={cn('h-3 w-3', si < Math.round(item.ratingAvg) ? 'fill-warning text-warning' : 'text-muted')}
                                />
                              ))}
                              <span className="ml-1 text-xs text-muted-foreground">{item.ratingAvg.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      </HoverTiltCard>
                    </Link>
                  </Reveal3D>
                ))}
              </div>
            </Section3D>
          </section>
        </Reveal3D>
      )}
      </div>
    </>
  );
}

function Section3D({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <SpatialPanel depth={2} className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {children}
    </SpatialPanel>
  );
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}
