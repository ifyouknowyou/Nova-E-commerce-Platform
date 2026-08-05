# NOVA Commerce — Complete Bug & Security Audit

**Audit date:** 2026-08-05
**Auditor:** Claude Code (read-only; no production code was modified)
**Scope:** Entire monorepo — `apps/web` (Next.js 16 storefront + seller/admin dashboards), `apps/api` (NestJS 11), `packages/db` (Prisma), `packages/shared`, `packages/config`, Docker, CI.

> **Method note.** Per the audit command, no code was changed. Findings were produced by
> five parallel deep-read reviews (auth/RBAC, payments/orders/coupons/returns,
> products/uploads/reviews/search, Next.js frontend, schema/config/deps/CI) and every
> CRITICAL and HIGH finding was independently verified against the exact source lines
> quoted below. Statuses use `CONFIRMED` (exact code traced), `LIKELY` (high-confidence
> inference), `POTENTIAL` (theoretical), and `NOT TESTED` (runtime behavior not exercised).
> Nothing was "fixed" and nothing was marked fixed.

---

## 1. Executive Summary

NOVA Commerce is a well-architected, multi-vendor e-commerce platform. The baseline
controls are genuinely strong — server-side RBAC enforced at the API layer (not just the
UI), atomic stock decrement against overselling, coupon race serialization via
`SELECT … FOR UPDATE`, opaque rotated refresh tokens, Argon2id password hashing,
anti-enumeration on login/forgot-password, and a strict global `ValidationPipe`. No
insecure-direct-object-reference (IDOR) flaw was found on any user-owned resource.

However, the audit found **5 CRITICAL, 12 HIGH, 19 MEDIUM, 12 LOW and 6 INFO** findings.
The critical issues share a single theme: **the security model is configured but not
enforced at runtime.**

The most damaging confirmed defects are:

1. **Access JWTs never expire.** They are signed without `expiresIn`, so a leaked access
   token is valid forever.
2. **Account bans / store suspensions are cosmetic.** `login`, `refresh`, `googleLogin`
   and the stateless JWT strategy never check `user.status`/`deletedAt`, and seller
   endpoints never check `store.status`. An admin "Ban" or "Suspend" has zero runtime effect.
3. **Any registered customer can self-escalate to SELLER** by calling `POST /stores`.
4. **Refunds never move money.** A return approval writes a `Refund` row but never calls
   Stripe; combined with a never-armed webhook (`STRIPE_WEBHOOK_SECRET` empty), payment
   confirmation rests entirely on a client-triggered endpoint.
5. **Predictable/real secrets on disk** — placeholder JWT secrets that would allow token
   forgery if unrotated, plus a real Stripe test key and Twilio credentials in plain text.

Below each section lists findings with evidence, then a Top-10 remediation order.

---

## 2. Application Architecture (Phase 1 inventory)

```
apps/
  web/   Next.js 16 (App Router, standalone) + React 19 + Tailwind 4 + TanStack Query
         Route groups: (store) public storefront · (seller) seller dashboard · (admin) admin dashboard
  api/   NestJS 11 REST, global prefix /api, 20 controllers (~180 mapped routes)
packages/
  db/    Prisma schema (700 lines, 27 models), 3 migrations, seed
  shared/ Zod schemas + shared constants (CANCELLABLE_ORDER_STATUSES, pagination)
  config/ TS / ESLint / Prettier presets
docs/    Architecture, DB design, roadmaps, specs
.github/workflows/  ci.yml (lint/test/build on PRs)
```

**Auth flow (verified):** registration → 6-digit email verification code (DB columns) →
login with Argon2id → short access JWT (stateless, roles baked in) + opaque 48-byte
refresh token stored as SHA-256 in Redis with TTL and rotation on every refresh.
Google OAuth exchanges an HTTP-only one-time code (stored in Redis) for tokens.

**Guard chain (verified, correct order):** `ThrottlerGuard → JwtAuthGuard → RolesGuard →
PermissionsGuard → ExcludeRolesGuard`, registered globally in `app.module.ts`. `@Public()`
skips only the JWT guard. Permission data is re-read from the DB per request
(`permissions.guard.ts`), so authorization is genuinely server-side.

**Runtime state (Phase 2):** Infra (Postgres 16, Redis 7, MinIO) healthy; API boots
cleanly with all routes mapped; Web serves 200. `next build` + `eslint` pass. No automated
tests exist for `@nova/web` or `@nova/shared`.

---

## 3. Findings Summary

| Severity | Count | Themes |
|----------|-------|--------|
| CRITICAL | 5 | Non-expiring JWTs, secrets on disk, bans/suspensions unenforced, self-service SELLER, silent free-payment fallback |
| HIGH     | 12 | Dead webhook, `processing`≈paid, refunds never pay out, paid-order cancel w/o refund, unvalidated order state machine, Google unverified-account linking, schema↔migration drift, upload (memory DoS, MIME trust), Docker/web build break, admin UI permission-code mismatch |
| MEDIUM   | 19 | OTP brute-force, reset-token storage, enumeration, review/hide rating bugs, moderation dead-code, open redirect, localStorage tokens, CORS footgun, tax/address/revenue data issues, image-key trust, functional filters/sort, pagination 500s |
| LOW      | 12 | Missing CSP, O(n) session revocation, Docker root, dep mismatches, CI gaps, doc drift |
| INFO     | 6  | Lockfile, redundant indexes, health depth, prod migration step, Swagger, roadmap drift |

---

## 4. CRITICAL Findings

### C1 — Access JWTs never expire (leaked token = permanent access)

- **Category:** Authentication / Token lifecycle
- **Affected File:** `apps/api/src/auth/tokens.service.ts:30-33`, `apps/api/src/auth/auth.module.ts:17`
- **Affected Endpoint:** all authenticated routes
- **Status:** CONFIRMED
- **Description:** `issueAccessToken()` signs with `{ sub, email, roleCodes }` and
  `secret` but **no `expiresIn`**. `auth.module.ts` registers `JwtModule` with
  `signOptions: {}`. The configured `JWT_ACCESS_TTL=15m` (`configuration.ts`) is never read.
- **Proof:**
  ```ts
  // tokens.service.ts:31-32
  const payload: JwtAccessPayload = { sub: userId, email, roleCodes };
  return this.jwt.signAsync(payload, { secret: this.config.jwtAccessSecret });
  // auth.module.ts:17
  useFactory: () => ({ signOptions: {} }),
  ```
- **Impact:** A stolen access token (e.g. via XSS of `localStorage`) is valid **forever**,
  including after the user changes password or is banned. `logout`/`logoutAll`/password
  change only revoke refresh sessions; the access token keeps working.
- **Recommended Fix:** pass `expiresIn` in `signAsync` (or a module default) and add
  `aud`/`iss`/`jti`. Optionally add a per-user `tokenVersion` checked on each request.
- **Regression Risk:** Low — frontend already refreshes on 401.

### C2 — Known/predictable JWT secrets + live credentials in plain text on disk

- **Category:** Security misconfiguration / Secrets management
- **Affected Files:** `apps/api/.env`, `.env.example`, `Login Password.txt`, `packages/db/prisma/seed.ts`
- **Status:** CONFIRMED (working tree); **NOT TESTED** whether already committed to a
  remote (repo has no `.git` yet, but `.gitignore` does not cover `Login Password.txt`)
- **Description:** `apps/api/.env` ships `JWT_ACCESS_SECRET=change_me_access_secret_openssl_rand_hex_64`
  and `JWT_REFRESH_SECRET=change_me_refresh_secret_openssl_rand_hex_64`. The config only
  validates presence, not value — so an unrotated deploy accepts these placeholders, and
  anyone who has read the repo can forge an `ADMIN` JWT. The same file contains a
  real-looking Stripe secret key. `Login Password.txt` contains a Twilio account SID,
  client secret and recovery code plus the seeded admin password, and is **not** matched by
  `.gitignore`.
- **Impact:** Full authentication and authorization bypass (forge `roleCodes:['ADMIN']`);
  exposure of payment/telephony credentials; default admin credentials
  (`admin@nova.test` / `AdminPassw0rd!`) make admin takeover trivial if the seed runs
  without overriding `ADMIN_PASSWORD`.
- **Recommended Fix:** rotate the Stripe key and Twilio credentials; generate
  `openssl rand -hex 64` secrets; fail fast in production if a secret equals a known
  placeholder; add `Login Password.txt` (and any `*.txt`/`*.md` secret dumps) to
  `.gitignore`.
- **Regression Risk:** Low.

### C3 — User bans/suspensions and account deletion are never enforced at runtime

- **Category:** Authorization / Account lifecycle
- **Affected Files:** `apps/api/src/auth/auth.service.ts:105-129` (login), `:131-143` (refresh),
  `:214-231` (googleLogin); `apps/api/src/auth/strategies/jwt-access.strategy.ts:24-31`;
  `apps/api/src/admin/admin.service.ts:79-83`
- **Status:** CONFIRMED
- **Description:** `login` checks only password + `emailVerifiedAt`; `refresh` checks only
  `user && emailVerifiedAt`; the JWT strategy does **no DB lookup** and trusts `payload.sub`
  plus the roles baked in at issuance. `setUserStatus('BANNED'/'SUSPENDED')` writes the row
  but nothing reads it.
- **Impact:** A banned or soft-deleted user keeps logging in, keeps rotating refresh tokens,
  and keeps placing orders indefinitely. Role/status changes take effect only at next token
  issuance (and since C1, tokens never expire).
- **Recommended Fix:** check `status === 'ACTIVE' && deletedAt === null` in login/refresh/
  googleLogin; in the JWT strategy (or a global guard) re-validate the user is active and
  re-read fresh roles; invalidate access tokens on status change (token version).
- **Regression Risk:** Medium — needs a DB hit per request or a short-lived token.

### C4 — Any registered customer can self-assign the SELLER role

- **Category:** Authorization / Privilege escalation
- **Affected Files:** `apps/api/src/store/store.controller.ts:19-24`; `apps/api/src/store/store.service.ts:76`;
  `apps/api/src/seller/seller.service.ts:20-27`
- **Status:** CONFIRMED
- **Description:** `POST /stores` is guarded only by `@ExcludeRoles('ADMIN')` — any
  authenticated CUSTOMER can create a store, and `createStore()` calls
  `rbac.assignRole(userId, 'SELLER')`. New stores default to `PENDING`, but
  `requireStoreId()` filters only `{ sellerId, deletedAt: null }` and **never checks
  `store.status`**, so a PENDING or SUSPENDED store's seller retains full seller API access
  (products, inventory, coupons, order-status changes).
- **Impact:** Full seller privileges (including order-item status changes and return
  refund approvals) are granted without admin approval; admin store suspension is
  cosmetic. Combined with the seller order-state flaw (H5), a self-created store can unlock
  refunds on unpaid orders.
- **Recommended Fix:** require explicit `@Roles('SELLER')` (or an approval workflow) before
  onboarding; enforce `store.status === 'ACTIVE'` in `requireStoreId`.
- **Regression Risk:** Medium — changes onboarding UX.

### C5 — Silent `MockPaymentProvider` fallback enables free checkout when Stripe is unconfigured

- **Category:** Payments / Business logic
- **Affected Files:** `apps/api/src/payments/payments.service.ts:16-25`, `:53-64`;
  `apps/api/src/payments/payment-providers.ts:29-31`
- **Status:** CONFIRMED (code); NOT ACTIVE in the current deployment (a Stripe key is set)
- **Description:** If `config.stripeSecretKey` is falsy, the service silently instantiates
  `MockPaymentProvider`, whose `confirm()` is a no-op that always "succeeds". Any
  authenticated user can then `POST /payments/{orderId}/start` → `/confirm` and have their
  order marked `PAID`/`CONFIRMED` with zero payment. This is the exact bootstrap state for a
  fresh deployment (`.env.example` leaves Stripe keys empty).
- **Impact:** Payment bypass / free checkout if the env var is ever unset or empty.
- **Recommended Fix:** gate the Mock provider behind an explicit non-production flag and
  reject when `NODE_ENV === 'production'`.
- **Regression Risk:** Low.

---

## 5. HIGH Findings

### H1 — Stripe webhook never fires: `STRIPE_WEBHOOK_SECRET` is empty

- **Affected File:** `apps/api/.env` (empty webhook secret); `apps/api/src/payments/payments.service.ts:71-74`
- **Status:** CONFIRMED
- **Description:** `handleWebhook` throws `'Webhook verification is not configured'` when the
  secret is empty, so the server-authoritative confirmation path is dead. Every paid order
  is confirmed solely by the client-triggered `POST /payments/:orderId/confirm`.
- **Impact:** Payment confirmation is client-trusted for fulfillment; refunds and
  `payment_intent.payment_failed` handling never run.
- **Fix:** set the webhook secret; enforce server-side webhook confirmation for fulfillment.

### H2 — Payment confirm accepts Stripe `processing` as success → premature "PAID"

- **Affected File:** `apps/api/src/payments/payment-providers.ts:60-62`; `payments.service.ts:53-64`
- **Status:** CONFIRMED
- **Description:** `confirm` passes when `intent.status === 'succeeded' || 'processing'`, and
  `confirm()` then flips the order to `PAID`/`CONFIRMED` and commits a CAPTURE transaction.
- **Impact:** Stock is reserved and the order is fulfilled for a payment that may later fail
  or be declined after authorization.
- **Fix:** require `succeeded` (or a dedicated post-auth capture step).

### H3 — Return refunds are DB records only — money never moves

- **Affected Files:** `apps/api/src/returns/returns.service.ts:133-158`
- **Status:** CONFIRMED (no `stripe.refunds.create` anywhere in the repo)
- **Description:** A return approval creates a `Refund` with `status:'PENDING'` and notifies
  the customer that "a refund is being processed", but no gateway refund is ever issued.
  Eligibility is only `orderItem.status === 'DELIVERED'` (checked at creation), and a seller
  can set DELIVERED regardless of payment status (H5), so refunds can be approved on
  never-paid orders.
- **Impact:** Customers never receive money; sellers/`decide` can "approve" refunds on
  unpaid orders; stock is restored and `soldCount` decremented on approval regardless.
- **Fix:** require a `PAID` payment; call the gateway to refund; mark refund `REFUNDED` only
  on success; add an admin-only payout flow.

### H4 — Cancelling a paid (CONFIRMED) order restores stock but never refunds

- **Affected File:** `apps/api/src/orders/orders.service.ts:249-270`
- **Status:** CONFIRMED
- **Description:** `cancel` checks `CANCELLABLE_ORDER_STATUSES` (which includes CONFIRMED per
  `packages/shared/src/index.ts`) but **not** `paymentStatus`. A paid order is cancelled,
  stock + `soldCount` restored, and the customer keeps paying.
- **Impact:** Customer loses goods *and* money; coupon usage is not rolled back either.
- **Fix:** if `paymentStatus === 'PAID'`, issue a refund (and reverse coupon usage) before
  cancelling.

### H5 — Seller order-item state machine is unvalidated

- **Affected File:** `apps/api/src/seller/seller.service.ts:308-318`
- **Status:** CONFIRMED
- **Description:** `updateOrderItemStatus` whitelists statuses but permits illegal jumps
  (e.g. `PENDING → DELIVERED`), cancel of a delivered/refunded item, has no payment-status
  guard, and does **not** restore stock/`soldCount` or create a refund on seller cancel
  (unlike the customer-cancel path).
- **Impact:** Sellers can cheaply mark orders DELIVERED to unlock returns/reviews on
  unpaid orders; seller-cancelled paid items leak inventory without refund.
- **Fix:** enforce a transition map, block unpaid items from DELIVERED, restore stock on
  seller cancel, and mirror the refund logic.

### H6 — Google OAuth links to an unverified account (account takeover)

- **Affected File:** `apps/api/src/auth/auth.service.ts:214-231`
- **Status:** CONFIRMED
- **Description:** `googleLogin` binds `googleId` to an existing account found by email
  **without checking that account's `emailVerifiedAt`**. If an attacker controls a Google
  account whose email equals a victim's registered-but-unverified account, they sign in as
  the victim with full session.
- **Fix:** only link Google accounts to already email-verified rows (or require
  verification before linking).
- **Regression Risk:** Low.

### H7 — Schema ↔ migration drift: fresh deployments break auth flows

- **Affected Files:** `packages/db/prisma/schema.prisma:109-110` (User
  `emailVerificationCode`, `emailVerificationExpiresAt`; `PaymentProvider` enum includes
  `MOCK`), vs `packages/db/prisma/migrations/20260803134525_init/migration.sql` (User table
  without those columns; enum `('STRIPE','PAYPAL')`). No later migration adds either.
- **Status:** CONFIRMED by inspection + live DB check (the running dev DB *does* have the
  columns and `MOCK` — it was evidently synced outside `migrate deploy`). So the break
  affects **fresh** databases provisioned via the documented `npm run db:migrate` path.
- **Impact:** On a clean deploy, registration/verify-email crash with "column does not
  exist", and the Mock payment provider fails to insert with an enum error — while CI passes
  (`ci.yml` swallows migration failures, H10/L-series).
- **Fix:** add a migration creating the two User columns and extending the enum with `MOCK`;
  reconcile `migration_lock.toml` (missing).

### H8 — Unbounded file upload → memory DoS

- **Affected File:** `apps/api/src/uploads/uploads.controller.ts:18`
- **Status:** CONFIRMED
- **Description:** `FileInterceptor('file')` sets no `limits`; multer buffers the entire
  request in memory. The 5 MB check in `uploads.service.ts:74` runs only after the full
  buffer is populated.
- **Fix:** `FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } })`.

### H9 — Upload trusts client MIME type; any authenticated user can store arbitrary bytes in a public bucket

- **Affected Files:** `apps/api/src/uploads/uploads.service.ts:71-91`; `uploads.controller.ts` (no `@Roles`);
  `apps/api/src/common/media-url.ts`
- **Status:** CONFIRMED
- **Description:** The extension/content-type is derived from the client-supplied mimetype
  (multer copies it from the multipart part) with **no magic-byte sniffing, no re-encoding,
  no dimension/decompression limits**. The bucket policy grants `s3:GetObject` to `*`
  (public-read). There is no role restriction, so customers can upload arbitrary bytes
  (GIF/SVG polyglots, decompression bombs) that are served publicly — a stored-XSS/abuse
  vector.
- **Fix:** sniff magic bytes (or re-encode with `sharp`), restrict to `@Roles('SELLER'/'ADMIN')`,
  consider a separate private bucket + signed URLs.

### H10 — Docker/web production build is broken (missing `public/`, API URL not baked)

- **Affected Files:** `apps/web/Dockerfile:25` (`COPY … ./apps/web/public` — `apps/web/public`
  does not exist → `docker build` fails); `next.config.ts` (`output:'standalone'` +
  `transpilePackages`) with `NEXT_PUBLIC_API_URL` never set as a build ARG, so client bundles
  bake the fallback `http://localhost:4000/api` (`apps/web/src/lib/api.ts:9`).
- **Status:** CONFIRMED (directory missing; env not passed as ARG)
- **Impact:** Web image cannot be built; even if it could, browsers would call the wrong API
  URL in production.
- **Fix:** create `public/` (or drop the COPY), pass `NEXT_PUBLIC_API_URL` as a build ARG,
  add a `.dockerignore`, and build workspace deps (`@nova/db`, `@nova/shared`) in the image
  (they currently rely on pre-existing gitignored `dist/` artifacts — see H11).

### H11 — Docker images depend on pre-built workspace `dist/` artifacts

- **Affected Files:** `apps/api/Dockerfile`, `apps/web/Dockerfile`
- **Status:** CONFIRMED / LIKELY (works when a local `dist/` exists; fails on clean checkout
  because `dist/` is gitignored and the images never `tsc`-build `@nova/db`/`@nova/shared`)
- **Fix:** run a turbo/tsc build of the workspace packages inside the builder stage.

### H12 — Frontend admin permission-code mismatch: admin management UI never renders actions

- **Affected Files:** `apps/web/src/app/(admin)/admin/users/page.tsx:21` (`user.manage` /
  `manage.users` / `users.manage`), `products/page.tsx:23`, `sellers/page.tsx:43`;
  backend real codes are colon-formatted (`users:manage`, `sellers:manage`, `products:approve`,
  `rbac.seed.ts`); `apps/web/src/hooks/use-permissions.ts:23` does exact `perms.includes(...)`
- **Status:** CONFIRMED (functional UI bug; backend still enforces `@Roles('ADMIN')`, so this
  is not a security bypass)
- **Impact:** Suspend/Activate user, Approve/Reject product, and seller-management buttons
  never render, even for a full admin — the admin workflows are unusable from the UI.
- **Fix:** use the real colon-format codes (or drop the client gate and rely on the backend).

---

## 6. MEDIUM Findings

| ID | Finding | File | Status |
|----|---------|------|--------|
| M1 | Email-verify 6-digit OTP is brute-forceable: `verifyEmail` has no `@Throttle` (only global 60/min), 1M space, 30-min TTL | `auth.controller.ts:52-57`, `auth.service.ts:246-257` | CONFIRMED |
| M2 | Password-reset tokens stored **raw** in Redis (`reset:${token}`) vs hashed refresh tokens; a Redis leak exposes all pending resets | `auth.service.ts:242-244` | CONFIRMED |
| M3 | Account enumeration via register: `ConflictException('An account with this email already exists')` (login/forgot are masked) | `auth.service.ts:53` | CONFIRMED |
| M4 | Hiding a review does not recompute `ratingAvg`/`reviewCount` — hidden (abusive) reviews keep inflating public ratings | `admin.service.ts:244-246` (no recalc) | CONFIRMED |
| M5 | Reviews are auto-`APPROVED` on create, so the PENDING moderation queue + admin "pendingReviews" KPI are dead code | `reviews.service.ts:50` | CONFIRMED (partially mitigated: requires verified paid purchase) |
| M6 | Editing an APPROVED product never resets it to PENDING for re-moderation; sellers can also set `ARCHIVED`/`DRAFT` directly | `seller.service.ts:135-162` | CONFIRMED |
| M7 | Open redirect after login/register via `?redirect=` (no internal-path allowlist) | `apps/web/src/app/(store)/login/page.tsx:38,55` | CONFIRMED |
| M8 | Access token in `localStorage` (XSS-stealable); refresh token in localStorage/sessionStorage — one XSS = full takeover (worsened by C1) | `apps/web/src/lib/api.ts`, `lib/auth.ts` | CONFIRMED |
| M9 | CORS footgun: `CORS_ORIGIN` silently defaults to `localhost:3000` in prod and nothing rejects `*` combined with `credentials: true` | `main.ts:41-44`, `configuration.ts` | CONFIRMED |
| M10 | Tax hardcoded to `0` at checkout despite a `tax.rate` setting (seed sets 0.08) — mispricing/revenue gap | `orders.service.ts:89` | CONFIRMED |
| M11 | A new address row is created on every checkout; DTO has no `addressId`, `isDefault` never honored → address duplication | `orders.service.ts:286-302` | CONFIRMED |
| M12 | Seller analytics + admin overview sum order totals over **non-cancelled** orders regardless of `paymentStatus` — revenue counts unpaid orders | `seller.service.ts:238-265`, `admin.service.ts:15-40` | CONFIRMED |
| M13 | `addImages` accepts arbitrary client-supplied S3 `key`s with no proof the caller uploaded them; `removeImage` deletes only the row, orphaning the S3 object | `seller.service.ts:183-198,214-222` | CONFIRMED |
| M14 | Price sort (`price_asc`/`desc`) ignores `salePrice`/effective price; price-range filter (`@IsInt`) rejects fractional prices like `19.99` → misleading "no products" | `products.service.ts` buildOrderBy; `products/dto/list-products.query.dto.ts:41-50` | CONFIRMED |
| M15 | Seller role staleness after store creation — current JWT lacks SELLER until refresh (up to 15 min of 403) | `store.service.ts:76`, `tokens.service.ts` | CONFIRMED |
| M16 | `maintenanceMode` setting is persisted but never enforced anywhere | `settings.service.ts` | CONFIRMED |
| M17 | Wishlist retains deleted and PRIVATE products (stale name/price/image) | `wishlist.service.ts` | CONFIRMED |
| M18 | Malformed `page`/`pageSize` on reviews/seller/admin list endpoints → negative/NaN Prisma skip → unhandled 500 | `reviews.controller.ts`, `seller.controller.ts`, `admin.controller.ts` | CONFIRMED |
| M19 | Guest-cart `x-session-token` is fully client-generated and merged into the user cart on login | `apps/web/src/lib/cart.ts:9-17` | LIKELY |

---

## 7. LOW & INFO Findings

| ID | Finding | Status |
|----|---------|--------|
| L1 | No CSP / security headers on the Next.js app (only `poweredByHeader:false`); helmet covers the API only | CONFIRMED |
| L2 | `revokeAllForUser` does a full Redis `scan('refresh:*')` per revocation — O(n) sessions | CONFIRMED |
| L3 | Docker runtime images run as root (`USER` not set) | CONFIRMED |
| L4 | `eslint-config-next@^15.4.2` vs installed `next@16.2.12` major mismatch | CONFIRMED |
| L5 | `next` listed as a dependency of `@nova/api` but never imported — bloat in the API image | CONFIRMED |
| L6 | Docs/README claim "Next.js 15"; installed Next 16.2.12 | CONFIRMED |
| L7 | No `.dockerignore` — `COPY . .` pulls in `node_modules`, `.next`, `dist`, `.turbo` | CONFIRMED |
| L8 | CI `npx prisma migrate deploy || true` swallows migration failures; no Docker build job in CI (broken H10/H11 would never be caught) | CONFIRMED |
| L9 | `@nova/web` and `@nova/shared` `test` scripts are `echo` stubs — root `npm test` is green with zero coverage | CONFIRMED |
| L10 | Seed ships default admin password `AdminPassw0rd!` (fallback unless `ADMIN_PASSWORD` set) | CONFIRMED |
| L11 | `transformOptions: { enableImplicitConversion: true }` weakens type coercion (prefer explicit `@Type()` + `forbidUnknownValues`) | CONFIRMED |
| L12 | `revokeAllForUser` doesn't invalidate the current access token (compounds C1/C3) | CONFIRMED |
| I1 | `prisma/migrations/migration_lock.toml` absent | CONFIRMED |
| I2 | `CouponUsage.orderId @unique` redundant with the `(couponId,userId,orderId)` composite | CONFIRMED |
| I3 | Health check pings only the DB, not Redis/S3 | CONFIRMED |
| I4 | `docker-compose.prod.yml` has no automated migration step (schema must be applied out-of-band) | CONFIRMED |
| I5 | Swagger enabled outside production only — acceptable; confirm the prod guard holds in deployment | CONFIRMED |
| I6 | Roadmap references a `docker/` dir that doesn't exist (doc drift) | CONFIRMED |

---

## 8. Areas Reviewed and Found Sound (no action needed)

- **IDOR / ownership.** All user-owned resources (orders, payments, addresses, cart,
  wishlist, notifications, returns, reviews) derive the target from `@CurrentUser()` and
  enforce ownership in the service layer. No cross-user access found.
- **Seller isolation.** `storeId` is always derived from the authenticated user; cross-seller
  product/order/coupon access is blocked in every mutation path.
- **Checkout integrity.** Totals are recomputed server-side from current prices; coupon
  limits are re-checked under `SELECT … FOR UPDATE`; stock is decremented atomically with an
  `updateMany({ stock: { gte: qty } })` guard inside a transaction (no oversell).
- **Credentials hygiene on the login path.** Argon2id hashing; uniform login/forgot errors;
  per-endpoint throttles on login/register/reset/forgot.
- **Global pipe/guard chain.** `ValidationPipe` with `whitelist` + `forbidNonWhitelisted`;
  correct global guard order; permissions re-read from the DB per request.
- **Stripe webhook signature code.** HMAC verification with `timingSafeEqual` and a 300 s
  window plus an idempotency guard — the implementation is correct, it is simply unreachable
  because the secret is empty (H1).
- **Refresh-token design.** Opaque, hashed at rest, rotated on refresh, TTL-scoped.
- **Search.** Parameterized Prisma queries; no injection; respects APPROVED+PUBLIC+not-deleted.

---

## 9. Severity Totals

| | Count |
|---|---|
| Total findings | **54** |
| CRITICAL | **5** |
| HIGH | **12** |
| MEDIUM | **19** |
| LOW | **12** |
| INFO | **6** |

---

## 10. Top 10 Priorities (recommended remediation order)

1. **C1 — Make access JWTs expire** (and add `jti`/`aud`/`iss`); invalidate on password
   change/status change via a token version.
2. **C2 — Rotate secrets, fail-fast on placeholders, gitignore `Login Password.txt`.**
3. **C3 — Enforce `user.status`/`deletedAt`** in login/refresh/googleLogin and per-request;
   enforce `store.status === 'ACTIVE'` in `requireStoreId`.
4. **C4 — Remove self-service SELLER escalation** (require approval; gate `POST /stores`).
5. **C5 + H1 + H2 + H3 — Payment integrity**: gate Mock provider to non-production, arm the
   Stripe webhook, require `succeeded`, and wire real gateway refunds for returns.
6. **H4 + H5 — Order-state machine**: block illegal transitions, refund+coupon-rollback on
   paid cancellations, restore stock on seller cancel.
7. **H7 — Reconcile schema ↔ migrations** (User verification columns, `MOCK` enum,
   migration_lock) so fresh deploys work.
8. **H8 + H9 — Harden uploads**: file-size limits, magic-byte sniffing, role restriction,
   and private-bucket strategy.
9. **H10 + H11 + L7/L8 — Fix the Docker/CI build chain** (public dir, build-time env,
   workspace deps, `.dockerignore`, fail-fast migrations, add a Docker build job).
10. **H12 + M1/M2/M3/M7/M8 — Auth/UX hardening**: fix admin permission codes, throttle
    verify-email, hash reset tokens, mask register conflict, internal-path redirect
    allowlist, move tokens to httpOnly cookies.

---

## 11. Files & Components Requiring Attention

| Component | Main concern |
|-----------|--------------|
| `apps/api/src/auth/` | Non-expiring JWTs, status not enforced, OTP/reset hardening |
| `apps/api/src/payments/` | Mock fallback, `processing`=paid, dead webhook |
| `apps/api/src/returns/` | Refunds never paid out |
| `apps/api/src/orders/` | Paid-cancel without refund, address duplication, tax=0 |
| `apps/api/src/seller/` | Store-status unenforced, state-machine gaps, image-key trust |
| `apps/api/src/store/` | Self-service SELLER escalation |
| `apps/api/src/uploads/` | MIME trust, no limits, no role gate |
| `apps/api/src/admin/` | Status changes with no runtime effect; review-hide rating bug |
| `apps/api/src/reviews/` | Auto-approve + moderation dead code |
| `packages/db/prisma/` | Schema↔migration drift |
| `apps/web/Dockerfile` / `next.config.ts` | Broken build, API URL not baked |
| `apps/web/src/app/(admin)/` | Permission-code mismatch |
| `.gitignore` / `Login Password.txt` | Unprotected secrets |
| `.github/workflows/ci.yml` | Swallowed migration failures; no Docker build |

## 12. Missing Tests (Phase 25)

No automated coverage exists for the highest-risk logic. Prioritize:

1. Auth: token expiry, refresh rotation, ban/suspend enforcement, OAuth account linking.
2. Authorization: permission matrix (customer/seller/admin/super-admin) per endpoint;
   cross-store isolation.
3. Orders: state transitions, paid-cancel → refund, coupon rollback.
4. Payments: webhook signature + idempotency, `succeeded`-only rule, refunds actually
   hitting the gateway.
5. Inventory: atomic decrement, restoration on cancel/return, negative-stock guard.
6. Coupons: per-user limits, concurrency (`FOR UPDATE`), negative-total rejection.
7. Refunds: never-paid-order guard, double-refund protection.
8. Seller isolation and admin permission enforcement (end-to-end).

## 13. Architecture Weaknesses (structural)

- **Stateless JWT + "revoke everywhere" is illusory.** Without an expiry (C1) or a
  per-request user/status/version check (C3), logout, password change, role change, and
  suspension cannot take effect. This single decision underpins four CRITICAL findings.
- **Payment confirmation depends on the client.** The authoritative webhook path exists but
  is unarmed (H1), and the confirm endpoint is client-triggered — the trust boundary is
  wrong by default.
- **"Two databases" for product identity.** Product variants exist (`ProductVariant`) but
  checkout/order-item logic reads `product.stock`, not variant stock; variant inventory is
  effectively unused — an architecture/feature gap that can produce inconsistent stock.
- **Moderation pipeline is nominal.** Review and product moderation states exist, but the
  create paths bypass them (auto-approve, edit-without-reapproval), so the admin queue is
  dead and public content is unmoderated.
- **No migration gate.** CI + Compose can deploy a schema that diverges from
  `schema.prisma` (H7, L8), producing runtime "column does not exist" failures in production.

---

## 14. Final Notes

This audit was read-only; nothing was changed. Statuses distinguish CONFIRMED (verified in
source), LIKELY/POTENTIAL (inferred), and NOT TESTED (runtime not exercised). No finding was
inflated, and none was hidden. The application is **not** declared "secure" or "bug-free":
the current deployment runs with a non-expiring-token architecture, a dead webhook, and
suspension/ban controls that do not enforce. **Stop for approval before any fix is applied.**
