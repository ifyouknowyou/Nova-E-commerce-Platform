/**
 * NOVA COMMERCE — shared domain contracts used by both the API and the web app.
 * Kept dependency-light: only Zod + plain TypeScript, no framework imports.
 */
export declare const ROLE_CODES: readonly ["CUSTOMER", "SELLER", "ADMIN"];
export type RoleCode = (typeof ROLE_CODES)[number];
export declare const PERMISSIONS: {
    readonly products: {
        readonly read: "products:read";
        readonly create: "products:create";
        readonly update: "products:update";
        readonly delete: "products:delete";
        readonly approve: "products:approve";
    };
    readonly categories: {
        readonly manage: "categories:manage";
    };
    readonly brands: {
        readonly manage: "brands:manage";
    };
    readonly cart: {
        readonly manage: "cart:manage";
    };
    readonly checkout: {
        readonly manage: "checkout:manage";
    };
    readonly orders: {
        readonly read: "orders:read";
        readonly update: "orders:update";
        readonly refund: "orders:refund";
    };
    readonly coupons: {
        readonly manage: "coupons:manage";
    };
    readonly reviews: {
        readonly manage: "reviews:manage";
    };
    readonly users: {
        readonly manage: "users:manage";
    };
    readonly sellers: {
        readonly manage: "sellers:manage";
    };
    readonly store: {
        readonly manage: "store:manage";
    };
    readonly inventory: {
        readonly manage: "inventory:manage";
    };
    readonly analytics: {
        readonly read: "analytics:read";
    };
    readonly reports: {
        readonly read: "reports:read";
    };
    readonly settings: {
        readonly manage: "settings:manage";
    };
    readonly roles: {
        readonly manage: "roles:manage";
    };
};
/** Recursively flattens the nested PERMISSIONS object into the union of all codes. */
type FlattenValues<T> = {
    [K in keyof T]: T[K] extends Record<string, string> ? FlattenValues<T[K]> : T[K];
}[keyof T];
export type Permission = FlattenValues<typeof PERMISSIONS>;
export declare const PRODUCT_STATUS: readonly ["DRAFT", "PENDING", "APPROVED", "REJECTED", "ARCHIVED"];
export type ProductStatus = (typeof PRODUCT_STATUS)[number];
export declare const PRODUCT_VISIBILITY: readonly ["PUBLIC", "PRIVATE"];
export type ProductVisibility = (typeof PRODUCT_VISIBILITY)[number];
export declare const ORDER_STATUS: readonly ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];
export type OrderStatus = (typeof ORDER_STATUS)[number];
export declare const PAYMENT_STATUS: readonly ["PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"];
export type PaymentStatus = (typeof PAYMENT_STATUS)[number];
export declare const PAYMENT_PROVIDER: readonly ["STRIPE", "PAYPAL"];
export type PaymentProvider = (typeof PAYMENT_PROVIDER)[number];
export declare const TRANSACTION_TYPE: readonly ["CAPTURE", "REFUND", "SETTLEMENT"];
export type TransactionType = (typeof TRANSACTION_TYPE)[number];
export declare const RETURN_STATUS: readonly ["REQUESTED", "APPROVED", "REJECTED", "REFUNDED"];
export type ReturnStatus = (typeof RETURN_STATUS)[number];
export declare const CANCELLABLE_ORDER_STATUSES: ReadonlySet<OrderStatus>;
export declare const USER_STATUS: readonly ["ACTIVE", "SUSPENDED", "BANNED"];
export type UserStatus = (typeof USER_STATUS)[number];
export declare const STORE_STATUS: readonly ["PENDING", "ACTIVE", "SUSPENDED"];
export type StoreStatus = (typeof STORE_STATUS)[number];
export declare const REVIEW_STATUS: readonly ["PENDING", "APPROVED", "HIDDEN"];
export type ReviewStatus = (typeof REVIEW_STATUS)[number];
export declare const MIN_RATING = 1;
export declare const MAX_RATING = 5;
export declare const CURRENCIES: readonly ["USD", "EUR", "GBP", "INR", "AUD", "CAD"];
export type CurrencyCode = (typeof CURRENCIES)[number];
export declare const DEFAULT_CURRENCY: CurrencyCode;
export declare const COUPON_TYPE: readonly ["PERCENTAGE", "FIXED"];
export type CouponType = (typeof COUPON_TYPE)[number];
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
export declare const DEFAULT_PAGE_SIZE = 20;
export declare const MAX_PAGE_SIZE = 100;
export {};
//# sourceMappingURL=index.d.ts.map