# NEXUS OS — AI-Native Business Operating System

Full-stack, multi-tenant, production-grade ERP delivered in 7 test-gated phases.
This repository is a **new workspace** building the upgraded architecture defined
in `build.md`, `7 phases.md`, and `architecture-upgrade-plan.md`.

> Baseline: the existing `NOVA Commerce` monorepo. NEXUS does **not** copy it —
> it rebuilds the same domain with the 7 architecture upgrades: **Postgres RLS
> multi-tenancy** (D1), a **locked OpenAPI API surface** (D2), **RBAC-as-data**
> (D3), human-in-loop AI approvals (D4), scoped 3D (D5), test-gated exits (D6),
> one AI context (D7).

## Stack

- **API:** NestJS 10 (TypeScript strict) + Prisma ORM + PostgreSQL 16
- **Web:** Next.js (thin shell in Phase 1; holds generated client types)
- **Book of truth:** OpenAPI/Swagger spec → `openapi-typescript` generated types
- **Mono:** Turborepo + npm workspaces

## Monorepo

```
packages/config  # tsconfig/eslint/prettier presets
packages/db      # Prisma schema, RLS migration, seed
packages/shared  # roles, permissions, error-code contract (framework-free)
apps/api         # NestJS REST API + Swagger
apps/web         # Next.js shell + generated API types
```

## Quick start

```bash
# 1. secrets
cp .env.example .env              # then set JWT_SECRET via: openssl rand -hex 64

# 2. bring up Postgres (host port 5433 — NOVA uses 5432)
docker compose up -d

# 3. install + (re)generate client + migrate + seed
npm install
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. run everything
npm run dev

# API  -> http://localhost:4000/api  (Swagger: /api/docs)
# Web  -> http://localhost:3000
```

## Tests (D6 — no hidden failing baseline)

```bash
npm run lint
npm run typecheck
npm test                 # unit
npm run test:e2e         # cross-tenant denial + RBAC gate + error-shape
npm run build
```

The cross-tenant e2e is the Phase 1 gate: with `set_config('app.org', <A>)`,
querying org B's rows returns zero results, and unset org returns zero (fail closed).

## Phase status

- ✅ Phase 1 — Foundation & Architecture (this scaffold + RLS + RBAC + API contract)
- ⏸ Phase 2 — Platform shell (auth / orgs / security / settings)
- ⏳ Phases 3–7 — business modules, automation, AI layer, release