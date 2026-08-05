# NOVA COMMERCE — Architecture Confirmation

**Status:** Approved baseline — v1.0
**Date:** 2026-08-02
**Source:** Master Specification Parts 1–6

---

## 1. System Overview

A multi-vendor enterprise e-commerce platform with three application surfaces
(Customer Website, Seller Dashboard, Admin Dashboard) served by one NestJS REST
API, one PostgreSQL database (Prisma ORM), and Redis for caching/sessions/queues.

```
                    ┌──────────────────────────────────────────────┐
                    │            apps/web  (Next.js 15)            │
                    │  Customer Store  · Seller Dashboard          │
                    │  Admin Dashboard · shared UI kit             │
                    └──────────────┬───────────────────────────────┘
                                   │ HTTPS / JSON
                    ┌──────────────▼───────────────────────────────┐
                    │            apps/api  (NestJS)                │
                    │  Feature modules · RBAC guards · validation  │
                    │  Stripe webhooks · email queue · search      │
                    └───┬───────────┬───────────┬──────────────────┘
                        │           │           │
              ┌─────────▼──┐  ┌─────▼─────┐  ┌──▼──────────┐
              │ PostgreSQL │  │   Redis   │  │ S3 (MinIO)  │
              │  (Prisma)  │  │ cache/sess│  │  images     │
              └────────────┘  └───────────┘  └─────────────┘
```

## 2. Technology Decisions

| Concern        | Choice                                        | Rationale                                              |
|----------------|-----------------------------------------------|--------------------------------------------------------|
| Monorepo       | npm workspaces + Turborepo                    | Single repo, shared packages, cached tasks             |
| Frontend       | Next.js 15 (App Router) + React + TS          | SSR/ISR for SEO, RSC for performance                   |
| UI             | Tailwind CSS v4 + shadcn/ui + Framer Motion   | Spec-mandated design system                            |
| Forms/Validation | React Hook Form + Zod                         | Server-side DTOs share Zod schemas via `@nova/shared`  |
| Data fetching  | TanStack Query (client) + RSC (server)        | Cache-first, optimistic UI                             |
| Backend        | NestJS 11 + TS, feature modules               | DI, guards, pipes, interceptors — spec-mandated        |
| ORM            | Prisma with PostgreSQL                        | Typed client, migrations                               |
| Cache/Session  | Redis (ioredis) — BullMQ queues               | Refresh-token revocation, cache, job queue             |
| Auth           | JWT (access) + rotating refresh (Redis)       | Google OAuth, email verification, Argon2id             |
| Payments       | Stripe (PaymentIntents) + webhook idempotency | `PaymentProvider` interface → PayPal-ready             |
| Storage        | S3-compatible (MinIO local / S3 prod)         | Sharp image processing pipeline                        |
| Search         | PostgreSQL full-text + trigram (initial)      | No extra infra; engine-agnostic service (Typesense-ready) |
| Email          | Resend (provider interface)                   | Transactional templates, dev fallback (console)        |
| Deploy         | Docker Compose + GitHub Actions               | Prod build, health checks, env separation              |

## 3. Gap Analysis — Resolved Decisions

The spec was analyzed across all 6 parts. The following gaps were identified and
resolved. Each is a *stated assumption* per Execution Rule 9.

| # | Gap                                                        | Resolution                                                        |
|---|------------------------------------------------------------|-------------------------------------------------------------------|
| G1 | **Store entity missing** (spec lists seller features but no Store table) | Add `Store` entity (seller-owned, settings, commission rate). Products → `storeId`. |
| G2 | **Seller settlement undefined** (multi-vendor payout)       | Add per-item `commissionRate` + `Transaction` ledger (settlement/refund types). Payout/withdrawal = Phase 9 stretch, architected. |
| G3 | **Return/Refund entities missing**                         | Add `ReturnRequest` + `Refund` with state machine (Requested → Approved/Rejected → Refunded). |
| G4 | **Refresh-token revocation**                               | Store refresh-token sessions in Redis; rotate + revoke on logout/password change. |
| G5 | **Review images** (Part 5 allows optional images)          | Add `ReviewImage` entity, validated uploads. |
| G6 | **Guest checkout → account linking**                       | Guest orders carry `email` + `guestToken`; claim via OTP on registration/login. |
| G7 | **Recently viewed**                                        | Server-backed per-user list (guest: localStorage). |
| G8 | **Search engine**                                          | Postgres FTS + pg_trgm; `SearchService` interface for dedicated engine later. |
| G9 | **Email provider**                                         | Resend via `MailProvider` interface; Nodemailer SMTP fallback for self-host. |
| G10 | **Order cancellation eligibility**                        | Cancellable only while status ∈ {Pending, Confirmed} and payment ≠ refunded; window from `cancellationWindowHours` setting. |
| G11 | **Notification delivery**                                  | In-app (DB) + email; architecture-ready for SSE/push (WebSocket listed optional). |
| G12 | **Order item seller split**                                | `OrderItem.storeId` enables per-seller fulfillment + commission. |

## 4. Security Posture (OWASP-aligned)

- Argon2id password hashing; never store plaintext.
- JWT access (15 min) + rotating refresh (14 d, Redis-backed, revocable).
- RBAC enforced server-side on every guarded route (`RolesGuard` + `PermissionsGuard`).
- Tenant isolation: sellers only access resources where `storeId == session.storeId` (Query scope guard).
- Zod DTO validation on every body/param/query; strict `whitelist`, `forbidNonWhitelisted`.
- Prisma parameterized queries (SQL-injection safe by construction).
- Helmet secure headers; CORS allowlist; CSRF token for cookie-based refresh.
- `@nestjs/throttler` rate limiting (auth endpoints stricter + lockout after N failures).
- Upload validation: MIME sniff, size/dimension limits, unique filenames, no path exposure.
- Stripe webhooks verified via signature; idempotency keyed by event id.
- Secrets via env only; `.env.example` documented; logs redact PII/tokens.
- AuditLog for admin/seller privileged actions (append-only).

## 5. Quality Bars

- Every phase compiles, runs, and is testable before the next begins.
- Unit + integration + E2E + API tests (Jest + Supertest + Playwright) per Part 6.
- WCAG AA; keyboard nav; focus states; semantic HTML.
- Homepage/dashboard < 2 s (target LCP < 2.5 s); image optimization via `next/image` + Sharp.
- No demo code, no placeholder pages, no fake APIs — per spec.
- Original design language; no copyrighted assets/branding copied.
