# NOVA COMMERCE — Implementation Roadmap

Executed phase-by-phase. Each phase must compile, run, and be testable before the
next begins. Per spec: continue phase by phase; stop for review only if requested.

## Folder Structure

```
nova-commerce/
├── apps/
│   ├── web/                      # Next.js 15 — customer store + seller + admin dashboards
│   └── api/                      # NestJS 11 — REST API
├── packages/
│   ├── db/                       # Prisma schema, migrations, seed, generated client
│   ├── shared/                   # Zod schemas, shared types/constants/enums (web + api)
│   └── config/                   # eslint / tsconfig / prettier presets
├── docker/                       # Dockerfiles, compose fragments
├── docs/
├── docker-compose.yml            # postgres, redis, minio, api, web
├── turbo.json
└── package.json                  # npm workspaces
```

## Phases

| Phase | Scope | Exit Criteria |
|-------|-------|---------------|
| **1** | Monorepo init, workspaces, Turborepo, TS/ESLint/Prettier, Docker Compose (postgres/redis/minio), env examples | `npm run build` passes for empty apps; `docker compose up` brings infra green |
| **2** | Auth: register/login/refresh/logout, Google OAuth, email verification, forgot/reset password, Argon2id, RBAC roles+permissions, guards | Unit + integration tests for auth & guards |
| **3** | Prisma schema (25 entities), migrations, seed (roles, permissions, admin, categories, brands, sample products/stores) | Migrate + seed run; `prisma generate` clean |
| **4** | Web foundation: layout, navigation, theme (dark/light/high-contrast), responsive shell, shared UI kit (shadcn), RHF+Zod forms, TanStack Query, toasts, skeletons, empty/error states | Storybook-less smoke: pages render, a11y basics pass |
| **5** | Customer website: homepage (hero/featured/flash/categories/brands), product listing + details, filters/sort, instant search, cart (persistent + guest), checkout (guest/registered, Stripe), order confirmation | Core purchase flow works end-to-end against API |
| **6** | Seller dashboard: overview, store settings, product/inventory CRUD, orders, coupons, analytics | Seller can onboard store + sell |
| **7** | Admin dashboard: overview, users/sellers, product moderation, categories/brands, orders, reviews, coupons, reports, settings, RBAC UI | Admin governs platform |
| **8** | Commerce depth: order lifecycle + timeline, payments webhooks, refunds/returns, reviews + moderation, coupons engine, notifications (in-app + email) | State machines covered by integration tests |
| **9** | Analytics/reports, Postgres FTS + trigram search optimization, low-stock alerts, bulk actions | Dashboards render real metrics; search < 200 ms on seed data |
| **10** | Unit/integration/E2E suites, performance budgets, a11y audit, docs sync, Docker prod images, GitHub Actions CI | Green CI; deployment runbook verified |

## Build/Verify Loop

- `npm run lint` · `npm run build` · `npm run test` per app after each phase.
- Prisma `db push` locally for dev iteration; tracked migrations for prod.
- API reachable at `http://localhost:4000/api`; Swagger at `/api/docs`.
