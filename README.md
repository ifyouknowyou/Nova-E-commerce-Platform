# NOVA Commerce

A production-ready, multi-vendor e-commerce platform with a customer storefront,
seller dashboard, and admin dashboard — built on a monorepo of **Next.js** (web)
and **NestJS** (API) with **PostgreSQL/Prisma**, **Redis**, and **S3-compatible storage**.
> Running Url: https://novaecommerce-platform.netlify.app/

> Original design language. No third-party brand assets are used.

## Stack

| Layer     | Tech                                                                  |
|-----------|-----------------------------------------------------------------------|
| Web       | Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4       |
| API       | NestJS 11 · TypeScript · REST                                          |
| Data      | PostgreSQL 16 · Prisma ORM · Redis (cache/sessions/queues)             |
| Auth      | JWT + rotating refresh tokens · Google OAuth · Argon2id · RBAC         |
| Payments  | Stripe (PayPal architecture-ready)                                     |
| Infra     | Docker Compose · GitHub Actions                                        |

## Workspace

```
apps/
  web/     # Customer storefront + seller/admin dashboards (Next.js)
  api/     # REST API (NestJS)
packages/
  db/      # Prisma schema, migrations, seed, client
  shared/  # Zod schemas + shared domain types/constants
  config/  # TypeScript / ESLint / Prettier presets
docs/      # Architecture, DB design, roadmap
```

## Quick start

```bash
# 1. Infrastructure (PostgreSQL, Redis, MinIO)
cp .env.example .env
docker compose up -d

# 2. API
cd apps/api
cp .env.example .env
npm run dev            # http://localhost:4000/api

# 3. Web
cd apps/web
cp .env.example .env.local
npm run dev            # http://localhost:3000
```

Or from the repo root with Turborepo:

```bash
npm run dev            # runs api + web concurrently
```

## Database

```bash
npm run db:generate    # generate Prisma client
npm run db:migrate     # create/apply migrations
npm run db:seed        # roles, permissions, admin, categories, sample data
```

## Documentation

See [docs/](docs/) for architecture, database design, and the phased roadmap.

## Scripts

- `npm run build` — build all workspaces
- `npm run lint` — lint all workspaces
- `npm run test` — run tests
- `npm run format` — Prettier over the repo
