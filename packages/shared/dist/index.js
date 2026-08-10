"use strict";
/**
 * NOVA COMMERCE — shared domain contracts used by both the API and the web app.
 * Kept dependency-light: only Zod + plain TypeScript, no framework imports.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_PAGE_SIZE = exports.DEFAULT_PAGE_SIZE = exports.COUPON_TYPE = exports.DEFAULT_CURRENCY = exports.CURRENCIES = exports.MAX_RATING = exports.MIN_RATING = exports.REVIEW_STATUS = exports.STORE_STATUS = exports.USER_STATUS = exports.CANCELLABLE_ORDER_STATUSES = exports.RETURN_STATUS = exports.TRANSACTION_TYPE = exports.PAYMENT_PROVIDER = exports.PAYMENT_STATUS = exports.ORDER_STATUS = exports.PRODUCT_VISIBILITY = exports.PRODUCT_STATUS = exports.PERMISSIONS = exports.ROLE_CODES = void 0;
// ---------------------------------------------------------------------------
// Roles & permissions
// ---------------------------------------------------------------------------
exports.ROLE_CODES = ['CUSTOMER', 'SELLER', 'ADMIN'];
exports.PERMISSIONS = {
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
};
// ---------------------------------------------------------------------------
// Catalog enums
// ---------------------------------------------------------------------------
exports.PRODUCT_STATUS = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'];
exports.PRODUCT_VISIBILITY = ['PUBLIC', 'PRIVATE'];
// ---------------------------------------------------------------------------
// Order enums
// ---------------------------------------------------------------------------
exports.ORDER_STATUS = [
    'PENDING',
    'CONFIRMED',
    'PACKED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'RETURNED',
];
exports.PAYMENT_STATUS = ['PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'];
exports.PAYMENT_PROVIDER = ['STRIPE', 'PAYPAL'];
exports.TRANSACTION_TYPE = ['CAPTURE', 'REFUND', 'SETTLEMENT'];
exports.RETURN_STATUS = ['REQUESTED', 'APPROVED', 'REJECTED', 'REFUNDED'];
exports.CANCELLABLE_ORDER_STATUSES = new Set(['PENDING', 'CONFIRMED']);
// ---------------------------------------------------------------------------
// User enums
// ---------------------------------------------------------------------------
exports.USER_STATUS = ['ACTIVE', 'SUSPENDED', 'BANNED'];
exports.STORE_STATUS = ['PENDING', 'ACTIVE', 'SUSPENDED'];
// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
exports.REVIEW_STATUS = ['PENDING', 'APPROVED', 'HIDDEN'];
exports.MIN_RATING = 1;
exports.MAX_RATING = 5;
// ---------------------------------------------------------------------------
// Settings / misc
// ---------------------------------------------------------------------------
exports.CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD'];
exports.DEFAULT_CURRENCY = 'USD';
exports.COUPON_TYPE = ['PERCENTAGE', 'FIXED'];
exports.DEFAULT_PAGE_SIZE = 20;
exports.MAX_PAGE_SIZE = 100;
//# sourceMappingURL=index.js.map