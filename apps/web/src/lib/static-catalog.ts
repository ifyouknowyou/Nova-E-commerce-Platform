import type {
  CategoryNode,
  PaginatedResult,
  ProductQuery,
  PublicBrand,
  PublicProduct,
} from '@/lib/api/types';

export const STATIC_CATALOG_MODE = process.env.NEXT_PUBLIC_CATALOG_MODE === 'static';

export const STATIC_CATEGORIES: CategoryNode[] = [
  { id: 'cat-electronics', name: 'Electronics', slug: 'electronics', imageUrl: null, children: [], productCount: 2, _count: { products: 2 } },
  { id: 'cat-home', name: 'Home & Living', slug: 'home-living', imageUrl: null, children: [], productCount: 2, _count: { products: 2 } },
  { id: 'cat-fitness', name: 'Sports & Fitness', slug: 'sports-fitness', imageUrl: null, children: [], productCount: 2, _count: { products: 2 } },
  { id: 'cat-apparel', name: 'Apparel', slug: 'apparel', imageUrl: null, children: [], productCount: 2, _count: { products: 2 } },
];

export const STATIC_BRANDS: PublicBrand[] = [
  { id: 'brand-nova', name: 'NOVA Audio', slug: 'nova-audio', logoUrl: null, productCount: 2 },
  { id: 'brand-aurora', name: 'Aurora Goods', slug: 'aurora-goods', logoUrl: null, productCount: 2 },
  { id: 'brand-zenith', name: 'Zenith Sport', slug: 'zenith-sport', logoUrl: null, productCount: 2 },
  { id: 'brand-forma', name: 'Forma Studio', slug: 'forma-studio', logoUrl: null, productCount: 2 },
];

function product(
  id: string,
  name: string,
  slug: string,
  sku: string,
  description: string,
  price: number,
  salePrice: number | null,
  stock: number,
  categoryIndex: number,
  brandIndex: number,
  image: string,
  ratingAvg: number,
  soldCount: number,
): PublicProduct {
  const category = STATIC_CATEGORIES[categoryIndex]!;
  const brand = STATIC_BRANDS[brandIndex]!;
  return {
    id,
    name,
    slug,
    sku,
    description,
    price,
    salePrice,
    effectivePrice: salePrice ?? price,
    stock,
    ratingAvg,
    reviewCount: Math.round(ratingAvg * 12),
    soldCount,
    isFeatured: ratingAvg >= 4.7,
    status: 'APPROVED',
    releaseDate: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    images: [{ id: `${id}-image`, url: `/catalog/${image}.svg`, alt: name, isPrimary: true }],
    store: { name: 'NOVA Select', slug: 'nova-select' },
    category: { id: category.id, name: category.name, slug: category.slug },
    brand: { id: brand.id, name: brand.name, slug: brand.slug },
  };
}

export const STATIC_PRODUCTS: PublicProduct[] = [
  product('demo-aurora-earbuds', 'Aurora Wireless Earbuds', 'aurora-wireless-earbuds', 'AUR-EB-001', 'Compact wireless earbuds with clear, balanced sound and a comfortable all-day fit.', 89, 69, 60, 0, 0, 'earbuds', 4.8, 320),
  product('demo-nova-speaker', 'Nova Smart Speaker', 'nova-smart-speaker', 'NVA-SP-002', 'A room-filling smart speaker with rich sound and a refined, minimal silhouette.', 149, null, 30, 0, 0, 'speaker', 4.7, 210),
  product('demo-aurora-mug', 'Aurora Travel Mug', 'aurora-travel-mug', 'AUR-MG-001', 'Double-wall ceramic travel mug that keeps your favorite drink at the right temperature.', 38, 32, 120, 1, 1, 'mug', 4.6, 180),
  product('demo-forma-lamp', 'Solstice Table Lamp', 'solstice-table-lamp', 'FRM-LP-004', 'A warm ambient lamp with a sculptural shade for desks, reading nooks, and bedside tables.', 96, null, 24, 1, 3, 'lamp', 4.8, 95),
  product('demo-zenith-mat', 'Zenith Studio Yoga Mat', 'zenith-studio-yoga-mat', 'ZTH-YG-003', 'Cushioned, grippy training mat made for daily movement, stretching, and recovery.', 68, 54, 80, 2, 2, 'yoga-mat', 4.9, 410),
  product('demo-zenith-shoes', 'Zenith Pace Running Shoes', 'zenith-pace-running-shoes', 'ZTH-RN-008', 'Lightweight road-running shoes with responsive cushioning and a breathable knit upper.', 128, null, 42, 2, 2, 'sneakers', 4.7, 290),
  product('demo-forma-shirt', 'Forma Everyday Shirt', 'forma-everyday-shirt', 'FRM-SH-006', 'A versatile soft-cotton shirt with an easy fit, clean lines, and durable stitching.', 58, 46, 55, 3, 3, 'shirt', 4.5, 150),
  product('demo-aurora-headphones', 'Aurora Studio Headphones', 'aurora-studio-headphones', 'AUR-HD-009', 'Comfortable over-ear headphones with detailed sound for focused listening at home or on the move.', 179, 159, 18, 0, 1, 'headphones', 4.9, 260),
];

export function listStaticProducts(query: ProductQuery = {}): PaginatedResult<PublicProduct> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(1, query.pageSize ?? 12);
  const search = query.q?.trim().toLocaleLowerCase('en-US');
  const categoryIds = query.categoryIds;

  let items = STATIC_PRODUCTS.filter((item) => {
    if (search && !`${item.name} ${item.description ?? ''} ${item.sku}`.toLocaleLowerCase('en-US').includes(search)) {
      return false;
    }
    if (query.categoryId && item.category.id !== query.categoryId) return false;
    if (categoryIds?.length && !categoryIds.includes(item.category.id)) return false;
    if (query.brandId && item.brand?.id !== query.brandId) return false;
    if (query.inStock === 'true' && item.stock <= 0) return false;
    if (query.inStock === 'false' && item.stock > 0) return false;
    if (query.sale === 'true' && item.salePrice === null) return false;
    if (query.sale === 'false' && item.salePrice !== null) return false;
    if (query.rating && item.ratingAvg < query.rating) return false;
    if (query.minPrice !== undefined && item.effectivePrice < query.minPrice) return false;
    if (query.maxPrice !== undefined && item.effectivePrice > query.maxPrice) return false;
    return true;
  });

  switch (query.sort) {
    case 'popular':
      items = [...items].sort((a, b) => b.soldCount - a.soldCount);
      break;
    case 'price_asc':
      items = [...items].sort((a, b) => a.effectivePrice - b.effectivePrice);
      break;
    case 'price_desc':
      items = [...items].sort((a, b) => b.effectivePrice - a.effectivePrice);
      break;
    case 'rating':
      items = [...items].sort((a, b) => b.ratingAvg - a.ratingAvg);
      break;
    case 'newest':
    default:
      items = [...items].reverse();
  }

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    meta: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export function getStaticProduct(slugOrId: string): PublicProduct | undefined {
  return STATIC_PRODUCTS.find((item) => item.slug === slugOrId || item.id === slugOrId);
}

export function getStaticRelatedProducts(productId: string, categoryId: string): PublicProduct[] {
  return STATIC_PRODUCTS.filter((item) => item.category.id === categoryId && item.id !== productId).slice(0, 4);
}

export function getStaticSuggestions(q: string) {
  const search = q.trim().toLocaleLowerCase('en-US');
  return STATIC_PRODUCTS.filter((item) => item.name.toLocaleLowerCase('en-US').includes(search))
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      category: item.category.name,
      effectivePrice: item.effectivePrice,
      image: item.images[0]?.url ?? null,
    }));
}
