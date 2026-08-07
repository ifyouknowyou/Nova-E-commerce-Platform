# ================================================================
# NEXUS OS — ARCHITECTURE UPGRADE PLAN
# ================================================================
# Companion to: build.md + 7 phases.md
# Goal: a deliberately better architecture than the current
# NOVA Commerce codebase, for a 21-module AI-native ERP.
#
# 7 key decisions, mapped to the phase where each is locked in.
# Each decision lists: WHAT to change, WHY, and HOW to verify.
# ================================================================


# ================================================================
# DECISION 1 — MULTI-TENANCY VIA POSTGRES RLS  (Phase 1 + 2)
# ================================================================
# Problem: The current codebase does tenancy in the app layer by
# scoping WHERE clauses. At 50+ entities that is the single largest
# source of cross-tenant data-leak bugs. One missed where(clause) in
# one of 150 endpoints => org A reads org B's invoices.
#
# Upgrade:
#   - Every business table carries `organization_id`.
#   - Enable PostgreSQL Row-Level Security (RLS) on those tables.
#   - Set the tenant as a session context on each request:
#         SET app.current_orgid = '<uuid>'
#   - Define a single RLS policy per table:
#         USING (organization_id = current_user_app_orgid() = ... )
#   - Wire Prisma so every tenant-scoped query runs with RLS active in
#     the same transaction as the auth check.
#
# Layering (industry best practice): App-layer RBAC (role check) +
# DB-layer RLS (tenant check). Both enforced; never either alone.
#
# VERIFY:
#   - A user in org A, calling any endpoint against org B's id, gets
#     zero rows (a leak or a hidden 404 — the query returns empty).
#   - Direct SQL outside the tenant context returns nothing.
#   - Null/absent org session => deny.

# (decision 1)


# ================================================================
# DECISION 2 — LOCK THE API SURFACE ONCE   (Phase 1)
# ================================================================
# The current backend is NestJS REST. For a 21-module ERP the cost you
# pay is: manual DTOs + a typed request/response DSL for ~150 endpoints.
# The "worst" output is NOT NestJS vs tRPC — it is 150 endpoints that
# are inconsistent and untyped.
#
# Upgrade: pick ONE and standardize.
#   Option A — Keep NestJS REST (lowest risk, protects your investment)
#     + strictly typed DTO classes + a shared OpenAPI/typespec contract.
#   Option B — tRPC: full end-to-end type safety, minimal boilerplate,
#     ideal for internal business UI talking to a co-located Next.js app.
#   Option C — Hono + OpenAPI: lighter than NestJS, typed, edge-friendly.
#
# Whatever you pick: one source of truth for routes + types, a shared
# error-code map, and generated client types. Never 150 ad-hoc endpoints.

# VERIFY:
#   - One source of truth for route + request/response types.
#   - Every endpoint returns the documented error shape.
#   - Error codes stable and searchable.

# (decision 2)


# ================================================================
# DECISION 3 — RBAC IS THE SINGLE AUTHZ SOURCE (Phase 1, 2, security)
# ================================================================
# Your project memory already flags the RBAC matrix as authoritative.
# Make it mechanical, not aspirational.
#
# Upgrade:
#   - Model the matrix as data (role -> permission -> entity/action),
#     migratable in the DB, seedable, and editable by OWNER/ADMIN.
#   - A single reusable guard used by every protected route + every
#     RLS check. Role changed once -> effect everywhere.
#   - Roles: OWNER, ADMIN, MANAGER, SALES, FINANCE, OPERATIONS, HR,
#     SUPPORT. No hard-coded role checks scattered in controllers.
#
# VERIFY:
#   - A route guarded exactly once, through the guard.
#   - No role string literals outside the matrix definition.
#   - Privilege escalation is impossible to forge via client input.

# (decision 3)


# ================================================================
# DECISION 4 — REAL HUMAN-IN-LOOP AI APPROVALS (Phase 6)
# ================================================================
# The spec forbids mockups/fakes; the AI-approval module is a security
# guardrail, not a demo. AI must never take a sensitive/irreversible
# action (freeze, refund, transfer, publish) without explicit approval.
#
# Upgrade:
#   - Approval workflow with rules: sensitive action -> create approval
#     request -> notify/approver -> on approval execute / on deny abort.
#   - Full audit trail of every AI decision + its approval state.
#   - Escalation policy (auto-deny if unresolved / orphaned).
#
# VERIFY:
#   - No sensitive tool call executes unless an approval exists.
#   - Approval states are recorded and queryable.
#   - Sensitive action is immutable once executed (auditable).

# (decision 4)


# ================================================================
# DECISION 5 — SCOPE THE 3D UI TO THE EXECUTIVE TIER (Phase 7)
# ================================================================
# build.md's own rule: "Performance has priority over visual effects"
# and "do not make every screen unnecessarily 3D." The 3D experience is
# expensive and high-risk for an entire 21-module product.
#
# Upgrade:
#   - EMPLOYEE : flat, fast, clean 2D workspace (no Three.js).
#   - MANAGER  : analytical 2D with data-dense charts; tiny 3D accents
#                at most.
#   - OWNER / EXECUTIVE : immersive 3D command center only here.
#   - Lazy-load Three.js/react-three-fiber only for the Executive exit;
#     never bundle it app-wide; keep charts spatial via canvas/SVG.
#
# VERIFY:
#   - App main bundle has no Three.js. Executive view loads it lazily.
#   - Employee/Manager TTI (time-to-live) stays performant.

# (decision 5)


# ================================================================
# DECISION 6 — EXIT-GATE EVERY PHASE ON TESTS (all 7 phases)
# ================================================================
# build.md: "Do not allow known fail on tests." Each phase added a
# VERIFY gate in 7 phases.md; make it test-enforced, not prose.
#
# Upgrade:
#   - Each phase's VERIFY becomes an automated check (unit/integration)
#     that must pass before the next phase starts.
#   - No "known failing tests hidden" — a failing baseline blocks.
#   - A minimal ./scripts/verify-phase.sh runnable per phase.
#
# (decision 6)


# ================================================================
# DECISION 7 — ONE BUSINESS / ONE DATA MODEL / ONE AI CONTEXT
# ================================================================
# The AI layer reasons over the whole org. AI agents get a single
# tenant-scoped context that unifies modules + the Business Graph, so
# the copilot/agents answer against the real data model, not canned.
#
# Upgrade:
#   - Business Graph entity/relationship store is built in Phase 6.
#   - Agent context is formed from the graph + RBAC-scoped data.
#   - One AI context per org; cross-tenant data never enters it.
#
# (decision 7)


# ================================================================
# DECISION-TO-PHASE MAP
# ================================================================
#   Phase 1  : Decisions 1 (RLS base), 2 (API lock), 3 (RBAC base)
#   Phase 2  : Decision 1 (RLS enforcement), 3 (guard wiring)
#   Phase 6  : Decision 4 (AI approvals)
#   Phase 7  : Decision 5 (3D scope), 6 (test gates), 7 (AI context)
#   All      : Decision 6 (test-gated exits)
#
# RULE: lock Decisions 1-3 in Phase 1. Decide 2 once and standardize
# utterly. They are the most expensive to change later.
# ================================================================