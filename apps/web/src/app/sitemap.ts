import type { MetadataRoute } from 'next';
import { STATIC_CATEGORIES, STATIC_PRODUCTS } from '@/lib/static-catalog';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/deals`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/collections`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/help`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/careers`, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const categories = STATIC_CATEGORIES.map((category) => ({
    url: `${SITE_URL}/products?categoryId=${category.id}`,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  const products = STATIC_PRODUCTS.map((product) => ({
    url: `${SITE_URL}/products/${product.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  return [...staticRoutes, ...categories, ...products];
}
