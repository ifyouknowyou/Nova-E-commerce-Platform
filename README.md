# NOVA Commerce

A monorepo containing a database-free, browse-only **Next.js** product catalog
and the preserved **NestJS** API / **PostgreSQL/Prisma** backend source.

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
  web/     # Browse-only catalog storefront (Next.js; bundled sample data)
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

## Database-free catalog deployment

The web storefront is a browse-only catalog and does not require PostgreSQL,
Redis, the API, or external media storage. It uses bundled sample products,
categories, and brands, with local SVG product artwork under
`apps/web/public/catalog/`.

```bash
cd apps/web
cp .env.example .env.local
npm run build
npm run start
```

The storefront supports browsing, product filters, search, product details, and
deals. Cart, checkout, authentication, and seller/admin workflows are not part
of this web app. The API and database source remain available for separate use.

## Documentation

See [docs/](docs/) for architecture, database design, and the phased roadmap.

## Scripts

- `npm run build` — build all workspaces
- `npm run lint` — lint all workspaces
- `npm run test` — run tests
- `npm run format` — Prettier over the repo
