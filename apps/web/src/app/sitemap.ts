import type { MetadataRoute } from 'next';
import { apiFetch } from '@/lib/api';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const PAGE_SIZE = 50;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/deals`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/sell`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/help`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/careers`, changeFrequency: 'monthly', priority: 0.3 },
  ];

  let categories: MetadataRoute.Sitemap = [];
  let products: MetadataRoute.Sitemap = [];

  try {
    const catRes = await apiFetch<{ items?: { slug: string }[]; id?: string; slug?: string }[] | { items?: { slug: string }[] }>(
      '/categories',
    );
    const catItems = Array.isArray(catRes) ? catRes : ((catRes as { items?: { slug: string }[] }).items ?? []);
    categories = catItems.map((c) => ({
      url: `${SITE_URL}/products?categoryId=${c.slug}`,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    // Paginate products using the API's meta.totalPages.
    const first = await apiFetch<{ items: { slug: string }[]; meta: { totalPages: number } }>(
      `/products?pageSize=${PAGE_SIZE}&page=1`,
    );
    const totalPages = first.meta?.totalPages ?? 1;
    const productSlugs = new Set(first.items.map((p) => p.slug));
    for (let page = 2; page <= totalPages; page++) {
      const res = await apiFetch<{ items: { slug: string }[] }>(`/products?pageSize=${PAGE_SIZE}&page=${page}`);
      for (const p of res.items) productSlugs.add(p.slug);
    }
    products = [...productSlugs].map((slug) => ({
      url: `${SITE_URL}/products/${slug}`,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch {
    // API unreachable (e.g. at build time in CI without a backend) — fall back
    // to the static routes only so the sitemap still emits valid XML.
  }

  return [...staticRoutes, ...categories, ...products];
}
