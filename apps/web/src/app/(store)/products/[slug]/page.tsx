import { notFound } from 'next/navigation';
import { Star } from 'lucide-react';
import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { ProductCard } from '@/components/product/product-card';
import { ProductGallery } from '@/components/product/product-gallery';
import { PurchasePanel } from '@/components/product/purchase-panel';
import { ReviewsSection } from '@/components/product/reviews-section';
import { Separator } from '@/components/ui/separator';
import { apiFetch } from '@/lib/api';
import type { PaginatedResult, PublicProduct } from '@/lib/api/types';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string): Promise<PublicProduct> {
  return apiFetch<PublicProduct>(`/products/${slug}`);
}

async function getRelated(product: PublicProduct): Promise<PublicProduct[]> {
  const res = await apiFetch<PaginatedResult<PublicProduct>>(
    `/products?categoryId=${product.category.id}&pageSize=4&sort=rating`,
  ).catch(() => null);
  return res?.items.filter((p) => p.id !== product.id) ?? [];
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    return {
      title: product.name,
      description: `Buy ${product.name} on NOVA Commerce.`,
    };
  } catch {
    return { title: 'Product not found' };
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  let product: PublicProduct;
  try {
    product = await getProduct(slug);
  } catch {
    notFound();
  }

  const related = await getRelated(product);

  return (
    <div className="page-container py-8">
      <Breadcrumbs
        items={[
          { label: 'Shop', href: '/products' },
          { label: product.category.name, href: `/products?categoryId=${product.category.id}` },
          { label: product.name, href: `/products/${product.slug}` },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <ProductGallery product={product} />
        </div>

        {/* Details */}
        <div>
          <p className="text-sm font-medium text-primary">{product.store.name}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h1>

          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-warning text-warning" />
              <span className="font-medium">{product.ratingAvg > 0 ? product.ratingAvg.toFixed(1) : '—'}</span>
            </span>
            <span className="text-muted-foreground">
              {product.reviewCount > 0 ? `${product.reviewCount} reviews` : 'No reviews yet'}
            </span>
            {product.brand && <span className="text-muted-foreground">· {product.brand.name}</span>}
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-display text-3xl font-bold">{formatPrice(product.effectivePrice)}</span>
            {product.salePrice !== null && (
              <span className="text-lg text-muted-foreground line-through">{formatPrice(product.price)}</span>
            )}
          </div>

          <Separator className="my-6" />

          <PurchasePanel product={product} />

          {product.description && (
            <>
              <Separator className="my-6" />
              <section aria-label="Product description">
                <h2 className="text-lg font-semibold">Description</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              </section>
            </>
          )}
        </div>
      </div>

      <div className="mt-16">
        <ReviewsSection productId={product.id} />
      </div>

      {related.length > 0 && (
        <section className="mt-16" aria-label="Related products">
          <h2 className="text-xl font-bold">Related products</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}
