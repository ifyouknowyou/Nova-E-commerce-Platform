# ADR-001 — Multi-tenancy via PostgreSQL Row-Level Security

**Status:** Adopted (Phase 1)
**Date:** 2026-08-07
**Source:** `architecture-upgrade-plan.md` → Decision 1; `7 phases.md` Phase 1-2.

## Context

The baseline (NOVA Commerce) enforced tenancy in the application layer with no
RLS. For a 21-module AI-native ERP, app-layer tenancy leaks when a query misses
an org filter. NEXUS needs hard, database-enforced isolation that cannot be
skipped by an errant `findMany`.

## Decision

Every tenant-scoped table carries `org_id`. PostgreSQL **Row-Level Security** is
enabled with a per-table policy:

```sql
USING (org_id = NULLIF(current_setting('app.org', true), '')::uuid)
WITH CHECK (org_id = NULLIF(current_setting('app.org', true), '')::uuid)
```

- Two roles: `nexus_migrate` (BYPASSRLS — migrations/seeds) and `nexus_app`
  (NOBYPASSRLS — the runtime API role).
- The API sets `SELECT set_config('app.org', <orgId>, true)` (transaction-scoped)
  inside `@nexus/db`'s `withTenant()` before any query.
- `organization_members` additionally has a `self_read` SELECT policy on
  `app.user_id` so sign-in can discover a user's memberships before an org claim exists.
- **Fail closed:** an unset/empty claim yields zero rows.

## Verification (all green)

- Cross-tenant e2e: org-A claim sees 0 org-B rows. ✓
- Fail-closed e2e: unset claim sees 0 rows. ✓
- RLS `rowssecurity=t` on all 10 tenant tables. ✓

## Consequences

- All runtime queries MUST go through `withTenant()`/`withUserContext()`.
- The `permissions` catalogue is global (not RLS-isolated) but mutation is
  guard-gated; org role wiring is tenant-isolated.