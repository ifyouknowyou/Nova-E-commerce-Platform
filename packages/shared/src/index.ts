/**
 * NOVA COMMERCE — shared domain contracts used by both the API and the web app.
 * Kept dependency-light: only Zod + plain TypeScript, no framework imports.
 */

// ---------------------------------------------------------------------------
// Roles & permissions
// ---------------------------------------------------------------------------

export const ROLE_CODES = ['CUSTOMER', 'SELLER', 'ADMIN'] as const;
export type RoleCode = (typeof ROLE_CODES)[number];

export const PERMISSIONS = {
  // Catalog
  products: { read: 'products:read', create: 'products:create', update: 'products:update', delete: 'products:delete', approve: 'products:approve' },
  categories: { manage: 'categories:manage' },
  brands: { manage: 'brands:manage' },
  // Commerce
  cart: { manage: 'cart:manage' },
  checkout: { manage: 'checkout:manage' },
  orders: { read: 'orders:read', update: 'orders:update', refund: 'orders:refund' },
  coupons: { manage: 'coupons:manage' },
  reviews: { manage: 'reviews:manage' },
  // Platform
  users: { manage: 'users:manage' },
  sellers: { manage: 'sellers:manage' },
  store: { manage: 'store:manage' },
  inventory: { manage: 'inventory:manage' },
  analytics: { read: 'analytics:read' },
  reports: { read: 'reports:read' },
  settings: { manage: 'settings:manage' },
  roles: { manage: 'roles:manage' },
} as const;

/** Recursively flattens the nested PERMISSIONS object into the union of all codes. */
type FlattenValues<T> = {
  [K in keyof T]: T[K] extends Record<string, string> ? FlattenValues<T[K]> : T[K];
}[keyof T];

export type Permission = FlattenValues<typeof PERMISSIONS>;

// ---------------------------------------------------------------------------
// Catalog enums
// ---------------------------------------------------------------------------

export const PRODUCT_STATUS = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'] as const;
export type ProductStatus = (typeof PRODUCT_STATUS)[number];

export const PRODUCT_VISIBILITY = ['PUBLIC', 'PRIVATE'] as const;
export type ProductVisibility = (typeof PRODUCT_VISIBILITY)[number];

// ---------------------------------------------------------------------------
// Order enums
// ---------------------------------------------------------------------------

export const ORDER_STATUS = [
  'PENDING',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

export const PAYMENT_STATUS = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];

export const PAYMENT_PROVIDER = ['STRIPE', 'PAYPAL'] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDER)[number];

export const TRANSACTION_TYPE = ['CAPTURE', 'REFUND', 'SETTLEMENT'] as const;
export type TransactionType = (typeof TRANSACTION_TYPE)[number];

export const RETURN_STATUS = ['REQUESTED', 'APPROVED', 'REJECTED', 'REFUNDED'] as const;
export type ReturnStatus = (typeof RETURN_STATUS)[number];

export const CANCELLABLE_ORDER_STATUSES: ReadonlySet<OrderStatus> = new Set(['PENDING', 'CONFIRMED']);

// ---------------------------------------------------------------------------
// User enums
// ---------------------------------------------------------------------------

export const USER_STATUS = ['ACTIVE', 'SUSPENDED', 'BANNED'] as const;
export type UserStatus = (typeof USER_STATUS)[number];

export const STORE_STATUS = ['PENDING', 'ACTIVE', 'SUSPENDED'] as const;
export type StoreStatus = (typeof STORE_STATUS)[number];

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export const REVIEW_STATUS = ['PENDING', 'APPROVED', 'HIDDEN'] as const;
export type ReviewStatus = (typeof REVIEW_STATUS)[number];

export const MIN_RATING = 1;
export const MAX_RATING = 5;

// ---------------------------------------------------------------------------
// Settings / misc
// ---------------------------------------------------------------------------

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD'] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

export const COUPON_TYPE = ['PERCENTAGE', 'FIXED'] as const;
export type CouponType = (typeof COUPON_TYPE)[number];

// ---------------------------------------------------------------------------
// Pagination contract (shared by every list endpoint)
// ---------------------------------------------------------------------------

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
