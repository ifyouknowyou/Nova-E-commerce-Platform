# ================================================================
# 7 PHASES OF THE NEXUS OS MASTER BUILD COMMAND
# ================================================================
# Source   : build.md — "MASTER AI CODING COMMAND"
# Product  : NEXUS OS — AI-Native Business Operating System
# Scope    : FULL-STACK / ENTERPRISE / PRODUCTION-GRADE
#
# Usage    : Run Phase 1 -> 2 -> ... -> 7 IN ORDER.
#            Each phase is a self-contained command. Run them
#            ONE AT A TIME. Only start the next phase AFTER the
#            current one is built, tested, and verified.
#
# Each phase references the relevant build.md sections.
#
# ARCHITECTURE UPGRADE: this file encodes the 7 upgrade decisions
# from architecture-upgrade-plan.md (RLS multi-tenancy, locked API
# surface, RBAC-as-data, human-in-loop AI approvals, scoped 3D,
# test-gated exits, ONE AI context). Follow that plan alongside.
# ================================================================


# ================================================================
# PHASE 1 — FOUNDATION & ARCHITECTURE
# ================================================================
# build.md sections: REPOSITORY AUDIT · CORE USER TYPES ·
#   DOMAIN MODEL · MULTI-TENANCY (28) · DATABASE (32) ·
#   API DESIGN (31) · PERMISSION MATRIX · ARCHITECTURE PROPOSAL
# ----------------------------------------------------------------

You are an elite engineering organization with 10+ years of experience in
enterprise SaaS, ERP, CRM, AI agents, security, cloud architecture,
databases, frontend engineering, UX, DevOps, QA, and performance engineering.

Your mission is to FOUND NEXUS OS — "The AI Operating System for Growing
Businesses". You are ONLY doing Phase 1: Foundation & Architecture. Do not
build business modules yet — those come in later phases.

1. INSPECT THE REPOSITORY. First inspect the entire repository. Determine the
existing framework, frontend and backend architecture, database, ORM, auth,
API architecture, packages, components, tests, env config, and deployment
config. NEVER blindly rewrite an existing project — preserve working
functionality unless there is a verified reason to replace it. If the repo is
empty, initialize a professional multi-tier architecture.

2. ESTABLISH THE STACK (match what the repo already has; else default):
   - Frontend    : React 19 + Next.js 16 (App Router), TypeScript strict.
   - Backend     : Next.js route handlers + typed API layer.
   - Database+ORM: PostgreSQL + Prisma.
   - Auth        : session-based, organization-aware multi-tenancy.
   - Monorepo    : Turborepo workspaces (apps/*, packages/*).

3. DESIGN THE DOMAIN MODEL. Map the whole product's entities (later phases
fill each module): Organization, User, Role/Permission, and the full entity
list — Customer, Lead, Deal, Product, SKU, Project, Task, Invoice, Payment,
Expense, Employee, Department, Ticket, Document, Workflow, AIConversation,
AIMessage, AIToolCall, AIAgent, AIApproval, Notification, AuditLog,
BusinessGraph. Every entity must have IDs, timestamps, soft deletion, an
audit relationship, and updatedBy tracking, all scoped by organizationId.

4. DESIGN THE DATABASE (UPGRADE: Postgres RLS multi-tenancy). Produce a
normalized, migration-friendly Prisma schema with `organization_id` on every
business table. Enable PostgreSQL Row-Level Security: on each request set the
tenant as a session variable and define a single USING(organization_id =
current org) policy per table. Wire Prisma so every tenant-scoped query runs
RLS in the same transaction as the auth check. Add indexes for hot query
paths. Design for immutable stock movements to avoid race conditions and
negative inventory. Tenancy is enforced at the DB layer, not just app code.

5. DESIGN THE API (UPGRADE: lock the surface once). Choose ONE API pattern
(recommended: keep NestJS REST + a shared OpenAPI/type contract — low risk;
or tRPC for full end-to-end types). Define naming, status and error codes so
errors are consistent product-wide. One source of truth for routes + types +
errors for every endpoint. Generate client types consumed by the Next.js app.

6. BUILD THE PERMISSION MATRIX (UPGRADE: RBAC-as-data). Model the RBAC matrix
as migratable, seedable data (role -> permission -> entity/action). Wire a
single reusable guard (used by every protected route + every RLS check), so a
role change once effects everywhere. Cover OWNER, ADMIN, MANAGER, SALES,
FINANCE, OPERATIONS, HR, SUPPORT. Do NOT hard-code role literals or substitute
a different auth model — the RBAC matrix is authoritative.

7. SET UP QUALITY BASE. TypeScript strict, ESLint, Prettier, base theme
primitives, global env config, and a cost-quality baseline.

VERIFY (do not proceed until all hold):
- Repository audited; architecture decision recorded (ties to the upgrade plan).
- DB schema migrates cleanly; every table is tenant-scoped via RLS.
- Cross-tenant test: org A querying org B's id returns zero rows.
- RBAC is data-driven and enforced by the single reusable guard.
- Types / lint / format pass.
PROCEED to Phase 2 only after all of these are true.


# ================================================================
# PHASE 2 — PLATFORM SHELL: AUTH, ORGS & SECURITY CORE
# ================================================================
# build.md sections: CORE USER TYPES · ORGANIZATIONS (2) ·
#   SECURITY (27) · MULTI-TENANCY (28) · SETTINGS (20) ·
#   INTEGRATIONS (21) · PLATFORM LAYOUT
# ================================================================

You are still the elite engineering org building NEXUS OS. PHASE 2: build the
platform skeleton that every business module in later phases hangs off.

1. AUTHENTICATION. Implement a real, secure auth flow: sign-up, sign-in,
sign-out, email verification, password reset, and session handling. No
backdoors, no hard-coded secrets. Hash passwords, use httpOnly cookies,
guard against CSRF. Enforce roles from the RBAC matrix.

2. ORGANIZATIONS. A user belongs to an organization. Support org creation,
invite, join, switching, and membership. Enforce tenant isolation — a user in
org A must never see org B data in queries, routes, or the API. (UPGRADE: wire
each request to set the RLS session tenant before any query runs; verify the
cross-tenant denial test from Phase 1 holds on every auth'd route.)

3. SECURITY CENTER. Real security surfaces: session management, active
sessions, password policy, login history, and security events, backed by data.

4. SETTINGS. Organization + personal settings screens backed by real data:
org profile, general settings, user preferences. Persist to the DB.

5. INTEGRATIONS framework. Build the connector registry that later modules
use, with real working integration points only — no mocked behavior.

6. PLATFORM SHELL / ROUTING. Authorized dashboard layout, role-conditional
navigation, tenant-scoped route params, error boundaries, global 403/404
pages, loading states. Wire shared design tokens so the shell renders in both
light and dark and is responsive across breakpoints.

VALUE THE BASE. Include an accessible, minimal notification and audit hook
(real, persisted) ready to be extended.

VERIFY (do not proceed until all hold):
- Real auth works (sign-up, sign-in, sign-out, session).
- Org isolation holds; cross-org access is denied (RLS tenant check active).
- RBAC guards block unauthorized routes (guard + RLS both enforced).
- Security center + settings persist to DB.
- Shell + nav render in light/dark and are responsive.
- Types / lint / tests pass.
PROCEED to Phase 3 only after all of these are true.


# ================================================================
# PHASE 3 — CORE BUSINESS MODULES (REVENUE HALF)
# ================================================================
# build.md sections: EXECUTIVE DASHBOARD (1) · CRM (2) · SALES (3) ·
#                       PROJECT MANAGEMENT (4) · FINANCE (5) ·
#                       BUSINESS INTELLIGENCE (18) · ANALYTICS
# ================================================================

You are still the elite engineering org building NEXUS OS. PHASE 3: build the
revenue-facing business modules. These must be real, working functionality —
no demos, no mockups, no fake APIs.

1. CRM (section 2). Real customer management: leads, contacts, accounts,
deal pipeline, activity and follow-ups. Every screen loads and writes from
the DB through the typed API. Enforce RBAC + tenant isolation on every route.

2. SALES (section 3). Build sales functionality: quotes/offers, orders, and
related sales workflows, guarded by RBAC.

3. PROJECT MANAGEMENT (section 4). Build projects, tasks, milestones, and
assignment with status/workflow details from the spec.

4. FINANCE (section 5). Build the financial ledger: accounts/transactions,
invoices, payments, expenses, and reporting, matching the spec.

5. EXECUTIVE DASHBOARD (section 1). The dashboard must answer: WHAT HAPPENED?
WHAT IS HAPPENING? WHAT NEEDS ATTENTION? WHAT SHOULD I DO NEXT? — with
Revenue, Expenses, Profit, Customers, Leads, and Deals, all from real data.

6. BUSINESS INTELLIGENCE (section 18). Real analytics/BI surfaces on the data
already modeled.

VERIFY (do not proceed until all hold):
- Each module does real DB reads + writes (no fakes).
- RBAC and tenant isolation enforced on every route.
- Dashboard pulls from live data.
- Responsive + light/dark render.
- Types / lint / tests pass.
PROCEED to Phase 4 only after all of these are true.


# ================================================================
# PHASE 4 — OPERATIONS & SUPPORT MODULES
# ================================================================
# build.md sections: INVENTORY (6) · SUPPORT (7) · TEAM/HR (8) ·
#   DOCUMENTS (9) · GLOBAL SEARCH (10) · NOTIFICATIONS (11)
# ================================================================

You are the elite engineering org building NEXUS OS. PHASE 4: build the
operational and back-office modules.

1. INVENTORY (6). Build products, SKU, categories, suppliers, warehouses,
locations, stock, and stock movements. Track inventory through immutable
stock movements. Avoid race conditions and negative inventory.

2. SUPPORT (7). Build tickets, customers, agents, priority, status,
assignment, comments, and internal notes.

3. TEAM / HR (8). Build employees, departments, roles, and the HR workspace
per the spec.

4. DOCUMENT MANAGEDS (9). Build document management and workflows, with
real storage and access control.

5. GLOBAL SEARCH (10). Build global search across entities with RBAC-aware
and tenant-scoped results.

6. NOTIFICATION CENTER (11). Build real notifications: in-app + audit-hook
driven, correct read/unread state, membership-aware.

VERIFY:
- Every module does real CRUD against the DB.
- Stock movements are immutable; negative inventory impossible.
- Search and notifications are tenant- and role-scoped.
- Types / lint / tests pass.
PROCEED to Phase 5 only after all of these are true.


# ================================================================
# PHASE 5 — AUTOMATION, INTEGRATIONS & OBSERVABILITY
# ================================================================
# build.md sections: AUTOMATION ENGINE (12) · INTEGRATIONS (21) ·
#   AUDIT SYSTEM (29) · OBSERVABILITY (30)
# ================================================================

You are the elite engineering org building NEXUS OS. PHASE 5: build the
automation, integration, and observability layers.

1. AUTOMATION ENGINE (12). Build workflows, triggers, actions, and
executions from the spec — real, executing automations, guarded by tenant +
RBAC.

2. CONNECTORS / INTEGRATIONS (21). Build working connectors registered in the
Phase 2 framework — no mocked endpoints.

3. AUDIT SYSTEM (29). Build comprehensive audit logging across the product;
every important action is recorded, tenant-scoped, and queryable.

4. OBSERVABILITY (30). Add error tracking and consistent error handling site,
metrics/logs across the app. Do not allow known failing tests to be hidden.

VERIFY:
- Automations actually execute with correct lifecycle state.
- Audit records every mutation; only tenant's own data viewable.
- Errors are consistent and tracked.
- Lint / tests pass.
PROCEED to Phase 6 only after all of these are true.


# ================================================================
# PHASE 6 — AI LAYER & BUSINESS GRAPH
# ================================================================
# build.md sections: AI COPILOT (13) · AI TOOL SYSTEM (14) ·
#   AI AGENTS (15) · AI APPROVAL SYSTEM (16) · BUSINESS GRAPH (17)
# ================================================================

You are the elite engineering org building NEXUS OS. PHASE 6: build the
AI-native layer that makes NEXUS OS stand out.

1. AI COPILOT (13). Build the copilot over the ONE BUSINESS / ONE DATA MODEL /
ONE WORKSPACE / ONE AI CONTEXT principle: a chat that answers and acts across
the tenant's real data with guardrails.

2. AI TOOL SYSTEM (14). Implement the AI AIs to call platform tools (functions)
safely within tenant + RBAC scope.

3. AI AGENTS (15). Build autonomous agents that operate within tenant scope,
each with clearly defined permissions, executing real work.

4. AI APPROVAL SYSTEM (16) — UPGRADE: REAL HUMAN-IN-LOOP, never a stub.
Sensitive or irreversible AI actions (freeze, refund, transfer, publish) must
NOT execute without explicit approval. Build the approval workflow with rules:
sensitive action -> create approval request -> notify approver -> on approval
execute / on deny abort; add escalation (auto-deny if unresolved/orphaned).
Record full audit trail of every AI decision + approval state.

5. BUSINESS GRAPH (17) (UPGRADE: ONE AI context). Build the business graph:
entities, connections, relationship visualization on real data. It forms the
single tenant-scoped AI context — the copilot/agents answer against the graph +
RBAC-scoped data, never canned. Cross-tenant data never enters an agent context.

VERIFY:
- No sensitive tool call executes unless an approval exists (automated test).
- Approval states recorded, queryable, with auto-deny escalation.
- Copilot + agents act on real data via the ONE AI context, no canned
  responses, no cross-tenant data in context.
- No backdoors, all actions audited.
- Lint + tests pass.
PROCEED to Phase 7 only after all of these are true.


# ================================================================
# PHASE 7 — HARDENING, DESIGN & DELIVERY
# ================================================================
# build.md sections: DESIGN SYSTEM (24) · RESPONSIVE (25) ·
#   ACCESSIBILITY (26) · PERFORMANCE (33) · TESTING (34) · CI/CD (35) ·
#   DEV WORKFLOW (36) · SELF-REVIEW LOOP (37) · FINAL PRODUCT STANDARD (40)
# ================================================================

You are the elite engineering org delivering NEXUS OS. PHASE 7: finish and
harden the product to production standard.

1. DESIGN SYSTEM (24). Apply the unified, derived design system across app —
tokens, colors, spacing, and all reusable components used everywhere.

2. THE THREE VISUAL EXPERIENCES — UPGRADE: SCOPE THE 3D (Executive-tier only). Implement the
three tiers, but scope the 3D deliberately: EMPLOYEE = flat, fast, clean 2D
workspace (no Three.js); MANAGER = analytical, data-dense 2D with spatial
charts via canvas/SVG (at most tiny 3D accents); OWNER/EXECUTIVE = immersive
3D command center (Three.js / R3F here ONLY). Build so the app's main bundle
has NO Three.js — the Executive view lazy-loads it. We follow the spec's own
rule: Performance has priority over visual effects.

3. RESPONSIVE DESIGN (25) + ACCESSIBILITY (26). Every screen responsive and
accessible, matching the spec.

4. APPLICATIONS / MISSING MODULES. Complete any module listed in the spec not
yet built (e.g., Admin UI, Settings completion, remaining entities).

5. PERFORMANCE (33). Meet the stated performance targets; no unnecessary 3D,
optimize hot paths. Verify the Employee/Manager TTI stays performant and that
time-to-interactive does not regress.

6. TESTING (34) + CI/CD (35) + SELF-REVIEW (37) — UPGRADE: TEST-GATED EXITS.
Add comprehensive tests, a CI/CD pipeline, and a per-phase verify script
(./scripts/verify-phase.sh) that MUST pass before each next phase begins. No
known failing tests hidden — a failing baseline blocks progress. Run the full
Self-Review Loop (inspect, test, check auth, tenant isolation, error handling,
DB integrity, performance, accessibility, UI consistency; search for TODOs,
placeholders, fake APIs, and mocked production behavior; fix verified problems;
rerun).

7. FINAL PRODUCT STANDARD (end). Products must be SYSTEM SCALE. Final deliverable
   checklist: FUNCTIONAL, SECURE, SCALABLE, ACCESSIBLE, PERFORMANT,
   MAINTAINABLE, AI-NATIVE, MULTI-TENANT, PRODUCTION-ORIENTED, VISUALLY
   DISTINCTIVE.

8. NO FAKE COMPLETION (end). Do not claim done when anything is missing.
   Deliver a real product, not a generated template, and no back-doors from
   START to FINISH.

VERIFY (final release gate):
- All 7 phases complete and integrated as ONE system.
- Full test suite green; no hidden failing tests.
- Self-Review loop findings fixed.
- Design system applied end-to-end.
- Performance + accessibility targets met.
- The product is FUNCTIONAL / SECURE / SCALABLE / ACCESSIBLE /
  PERFORMANT / MAINTAINABLE / AI-NATIVE / MULTI-TENANT /
  PRODUCTION-ORIENTED / VISUALLY DISTINCTIVE.

# ================================================================
# END — ALL 7 PHASES OF NEXUS OS
# ================================================================