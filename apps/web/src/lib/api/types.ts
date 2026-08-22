/** Client-side mirrors of the NOVA API response shapes. */

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface PublicProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string | null;
  price: number;
  salePrice: number | null;
  effectivePrice: number;
  stock: number;
  ratingAvg: number;
  reviewCount: number;
  soldCount: number;
  isFeatured: boolean;
  /** Listings should only ever render APPROVED products. */
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  /** Future ISO date marks the product as "coming soon" (not yet purchasable). */
  releaseDate: string | null;
  createdAt: string;
  images: { id: string; url: string; alt: string | null; isPrimary: boolean }[];
  store: { name: string; slug: string };
  category: { id: string; name: string; slug: string };
  brand: { id: string; name: string; slug: string } | null;
}

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  parent?: CategoryNode | null;
  children: CategoryNode[];
  productCount?: number;
  isActive?: boolean;
  deletedAt?: string | null;
  sortOrder?: number;
  _count?: {
    products?: number;
  };
}

export interface PublicBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  productCount: number;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  priceSnapshot: number;
  savedForLater: boolean;
  product: {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    stock: number;
    effectivePrice: number;
  };
}

export interface CartResponse {
  id: string;
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  savedCount: number;
}

export interface ProductQuery {
  page?: number;
  pageSize?: number;
  q?: string;
  categoryId?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  sort?: 'newest' | 'popular' | 'price_asc' | 'price_desc' | 'rating';
  inStock?: 'true' | 'false';
  sale?: 'true' | 'false';
}
