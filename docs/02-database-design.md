# NOVA COMMERCE — Database Design (Prisma)

**Conventions:** UUID primary keys · `createdAt`/`updatedAt` timestamps ·
soft-delete via `deletedAt` where appropriate · indexes on all FK/filter columns ·
enforced FK relationships · normalized.

## Entities (25)

### Access & Identity
| Model | Notes |
|---|---|
| `User` | id, email (unique, ci), phone, passwordHash, name, avatarKey, status(ACTIVE/SUSPENDED/BANNED), emailVerifiedAt, googleId, rememberMe, deletedAt |
| `Role` | id, code (CUSTOMER/SELLER/ADMIN), name, description, isSystem |
| `Permission` | id, code, module, description |
| `RolePermission` | composite (roleId, permissionId) |
| `UserRole` | composite (userId, roleId) |
| `Address` | userId, type(SHIPPING/BILLING), line1..line3, city, state, postalCode, country, phone, isDefault, deletedAt |

### Catalog
| Model | Notes |
|---|---|
| `Store` | sellerId (unique), name, slug, logoKey, bannerKey, bio, businessInfo(json), status(PENDING/ACTIVE/SUSPENDED), commissionRate (decimal), settings(json: shipping, payment, currency), deletedAt |
| `Category` | parentId (self-ref, nested), name, slug, description, imageKey, sortOrder, isActive |
| `Brand` | name, slug, logoKey, description, isActive |
| `Product` | storeId, categoryId, brandId?, name, slug, sku, description, price, salePrice?, costPrice, stock, lowStockThreshold, weight, dimensions(json), status(DRAFT/PENDING/APPROVED/REJECTED/ARCHIVED), visibility(PUBLIC/PRIVATE), isFeatured, seo(json), ratingAvg, reviewCount, soldCount, deletedAt |
| `ProductImage` | productId, key, alt, sortOrder, isPrimary |
| `ProductVariant` | productId, name, sku, priceDelta, stock, options(json e.g. {color,size}), isActive |

### Commerce
| Model | Notes |
|---|---|
| `Cart` | userId? (guest), sessionToken?, expiresAt |
| `CartItem` | cartId, productId, variantId?, quantity, priceSnapshot, savedForLater |
| `WishlistItem` | userId, productId (unique pair) |
| `Coupon` | storeId? (null = global), code (unique, ci), type(PERCENTAGE/FIXED), value, minOrderValue, maxDiscount, usageLimit, usedCount, perUserLimit, startsAt, expiresAt, isActive, description |
| `CouponUsage` | couponId, userId, orderId, discountAmount, usedAt |
| `Order` | userId?, email (guest), guestToken?, status(PENDING/CONFIRMED/PACKED/SHIPPED/DELIVERED/CANCELLED/RETURNED), paymentStatus(PENDING/PAID/FAILED/REFUNDED/CANCELLED), subtotal, discount, shippingCost, tax, total, currency, shippingAddressId, billingAddressId, shippingMethod, trackingNumber?, invoiceNumber, notes?, placedAt, cancellationWindowExpiresAt |
| `OrderItem` | orderId, storeId, productId, variantId?, nameSnapshot, skuSnapshot, unitPrice, quantity, total, commissionRate, status(PENDING/CONFIRMED/SHIPPED/DELIVERED/CANCELLED/RETURNED/REFUNDED) |
| `OrderTimeline` | orderId, status, note?, actorId?, createdAt |
| `Payment` | orderId, provider(STRIPE/PAYPAL), providerPaymentId, amount, currency, status(PENDING/PAID/FAILED/REFUNDED/CANCELLED), method, metadata(json), webhookEventId (unique, idempotency) |
| `Transaction` | paymentId?, orderId, type(CAPTURE/REFUND/SETTLEMENT), amount, status, providerRef?, metadata(json) |
| `ReturnRequest` | orderItemId, userId, reason, description?, amount, status(REQUESTED/APPROVED/REJECTED/REFUNDED), adminNote? |
| `Refund` | returnRequestId?, paymentId, amount, status, reason, processedById |

### Engagement
| Model | Notes |
|---|---|
| `Review` | userId, productId, orderId?, rating(1-5), title?, comment, status(PENDING/APPROVED/HIDDEN), isVerifiedPurchase, helpfulCount, moderationNote? |
| `ReviewImage` | reviewId, key, sortOrder |
| `Notification` | userId, type(ORDER/CUSTOMER/SYSTEM), title, message, data(json), isRead, isArchived, createdAt |
| `NotificationPreference` | userId (unique), emailEnabled, orderEvents, marketing, security, lowStock |

### Platform
| Model | Notes |
|---|---|
| `Setting` | key (unique), group, value(json) — currency, taxes, shipping, SEO, theme |
| `AuditLog` | userId?, action, entityType, entityId, oldValue(json)?, newValue(json)?, ip, userAgent, createdAt (append-only) |

## Key Relationships

- `Product → Store → User(seller)` (tenant ownership)
- `OrderItem → Store` (per-seller fulfillment + commission)
- `Order → Addresses` (shipping/billing)
- `CouponUsage → Coupon` (usage limits enforced via increment in transaction)
- `ReturnRequest → OrderItem → Refund → Payment`
- `Review` (unique per user+product+order for verified purchase)

## Enforced invariants (application + DB level)
- Stock decrement + order creation in a single DB transaction.
- Coupon usage/limit checked atomically (row lock).
- Payment idempotency: unique `webhookEventId`.
- Soft-delete default-scoped for Products, Users, Categories.
- `storeId` on every write scoped to the authenticated seller.

## Search Indexing (initial)
- GIN index on `tsvector` derived from product name + description.
- `pg_trgm` GIN on name/slug for instant autocomplete + typo tolerance.
- Composite indexes: (categoryId, status, visibility), (storeId, status), (status, isFeatured), (ratingAvg desc), (soldCount desc).
