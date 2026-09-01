# NOVA CONTROL CENTER — MASTER BUILD COMMAND

You are an elite SaaS architect, senior Next.js/NestJS engineer, UI/UX designer, 3D interaction engineer, security engineer, and e-commerce platform architect.

Upgrade the existing **NOVA Commerce** project by fully building a production-ready **NOVA Control Center**: a multi-tenant commerce/business management platform inspired by the control-panel concept of cPanel, but designed specifically for e-commerce businesses, marketplace sellers, agencies, and enterprise clients.

## CORE RULE

DO NOT rebuild NOVA from scratch.

FIRST inspect the entire existing repository, architecture, database schema, authentication, RBAC, API, marketplace, seller dashboard, admin dashboard, products, categories, brands, orders, customers, payments, storage, deployment configuration, and existing UI.

Reuse existing functionality wherever possible.

Do not duplicate existing business logic.

Do not break existing marketplace, customer, seller, or admin functionality.

Do not replace working backend functionality merely to simplify implementation.

If a feature already exists, integrate it into Control Center instead of creating a second implementation.

---

# 1. PRODUCT VISION

Build:

NOVA
└── NOVA Control Center
├── Business Overview
├── Store Management
├── Products
├── Inventory
├── Orders
├── Customers / CRM
├── Marketing
├── Finance
├── Analytics
├── Team & Permissions
├── Integrations
├── Domains
├── API & Webhooks
├── Security
├── Notifications
├── Billing / Subscription
└── Settings

The Control Center must feel like a premium SaaS operating system rather than a normal CRUD admin dashboard.

---

# 2. MULTI-TENANT ORGANIZATION ARCHITECTURE

Introduce a secure organization/business layer if the current project does not already have one.

Core model:

User
→ Organization
→ Organization Membership
→ Store
→ Products
→ Orders
→ Customers
→ Inventory
→ Finance
→ Marketing
→ Analytics

Support:

* Organization owner
* Organization manager
* Product manager
* Warehouse staff
* Accountant
* Marketing manager
* Support agent
* Custom roles

Every organization must have strict tenant isolation.

A user must NEVER access another organization's:

* products
* orders
* customers
* inventory
* finance
* analytics
* employees
* API keys
* integrations
* settings

Enforce tenant isolation server-side, not only through frontend filtering.

---

# 3. RBAC + PERMISSION SYSTEM

Implement granular organization-level permissions.

Examples:

organization.read
organization.update
products.read
products.create
products.update
products.delete
inventory.read
inventory.update
orders.read
orders.update
customers.read
customers.update
marketing.manage
finance.read
finance.manage
analytics.read
team.manage
integrations.manage
domains.manage
api.manage
security.manage
billing.manage

Never trust client-side role checks.

Every protected API endpoint must validate:

authentication → organization membership → role → permission → resource ownership.

Prevent IDOR, privilege escalation, horizontal authorization bypass, and tenant breakout.

---

# 4. CONTROL CENTER DASHBOARD

Create a premium command-center dashboard.

Display:

* Revenue
* Orders
* Customers
* Products
* Inventory health
* Conversion metrics
* Recent orders
* Recent customers
* Top products
* Sales trends
* Low-stock alerts
* Marketing performance
* Financial summary
* System notifications

Include configurable dashboard widgets.

Allow:

* drag/reorder widgets
* collapse widgets
* responsive layouts
* saved dashboard preferences
* date-range filtering
* store filtering where permitted

Use realistic data states, not fake hardcoded production data.

Provide excellent:

* loading states
* skeletons
* empty states
* error states
* retry states

---

# 5. 3D DESIGN SYSTEM

Create a premium futuristic 3D SaaS interface.

The design should feel like:

"Commerce Command Center"

not a generic Bootstrap/admin template.

Use:

* React Three Fiber where appropriate
* Three.js
* Framer Motion / Motion
* GSAP only where useful
* CSS 3D transforms
* WebGL effects selectively
* GPU-friendly animations

Use 3D primarily for:

* dashboard hero
* business activity visualization
* analytics scenes
* warehouse/inventory visualization
* navigation transitions
* interactive data visualization
* premium empty states
* onboarding

DO NOT turn every component into 3D.

The interface must remain fast, readable, accessible, and professional.

---

# 6. VISUAL LANGUAGE

Create a distinctive NOVA visual system:

* premium dark/light modes
* deep spatial backgrounds
* subtle glass surfaces
* layered cards
* soft depth
* restrained glow
* floating data panels
* animated gradients
* geometric elements
* subtle grid systems
* high-quality typography
* precise spacing
* clear information hierarchy

Avoid:

* excessive neon
* childish 3D
* excessive particles
* spinning objects everywhere
* distracting animations
* generic dashboard templates
* visual clutter

3D should communicate information, not merely decorate the page.

---

# 7. MAIN NAVIGATION

Build a sophisticated Control Center sidebar.

Sections:

OVERVIEW

* Command Center

COMMERCE

* Store
* Products
* Categories
* Brands
* Inventory
* Orders

CUSTOMERS

* Customers
* CRM
* Segments
* Loyalty

GROWTH

* Marketing
* Campaigns
* Coupons
* Promotions
* Referrals

FINANCE

* Revenue
* Transactions
* Invoices
* Refunds
* Payouts
* Financial Reports

INTELLIGENCE

* Analytics
* Business Insights
* Reports

ORGANIZATION

* Team
* Roles
* Permissions
* Activity

PLATFORM

* Integrations
* Domains
* API
* Webhooks

SYSTEM

* Notifications
* Security
* Billing
* Settings

Navigation must be:

* collapsible
* keyboard accessible
* mobile responsive
* permission aware
* state preserving
* animated

---

# 8. STORE MANAGEMENT

Build:

* store profile
* logo
* branding
* store identity
* navigation
* homepage configuration
* banners
* pages
* SEO
* social links
* checkout configuration
* shipping settings
* payment configuration
* store status

Create a visual store configuration interface.

Where appropriate, provide live preview.

---

# 9. PRODUCT MANAGEMENT

Integrate existing NOVA product functionality.

Support:

* products
* variants
* SKUs
* categories
* brands
* pricing
* discounts
* media
* attributes
* product status
* bulk actions
* import/export where architecture supports it

Build advanced product tables with:

* search
* filters
* sorting
* pagination
* column controls
* bulk selection
* bulk updates

Do not duplicate existing product APIs.

---

# 10. INVENTORY CENTER

Build:

* stock overview
* warehouses
* stock movements
* low-stock alerts
* out-of-stock products
* inventory history
* SKU tracking
* stock adjustments

Create a visual inventory health experience.

Use optional 3D warehouse visualization for premium presentation.

Never compromise usability for 3D.

---

# 11. ORDER CENTER

Build an advanced order-management interface.

Support:

* order search
* status filters
* customer filtering
* date filtering
* payment status
* fulfillment status
* order details
* timeline
* refunds
* shipment information
* internal notes
* order activity

Integrate with existing NOVA order APIs.

Never create conflicting order state machines.

---

# 12. CUSTOMER CRM

Build:

* customer directory
* profiles
* purchase history
* lifetime value
* order history
* customer segmentation
* customer notes
* loyalty information
* activity timeline

Provide advanced filtering and segmentation.

Protect customer data with strict authorization.

---

# 13. MARKETING CENTER

Build:

* campaigns
* coupons
* discounts
* promotions
* flash sales
* referrals
* loyalty
* abandoned-cart workflows where backend support exists
* campaign analytics

Provide visual campaign builders where appropriate.

---

# 14. FINANCE CENTER

Build a professional financial dashboard.

Include:

* revenue
* transactions
* refunds
* payouts
* invoices
* expenses where supported
* financial reports
* payment methods
* settlement information

Clearly distinguish:

* gross revenue
* refunds
* fees
* payouts
* net revenue

Do not invent accounting data.

Use actual backend data.

---

# 15. ANALYTICS / BUSINESS INTELLIGENCE

Build interactive analytics.

Include:

* sales trends
* order trends
* customer growth
* product performance
* conversion
* average order value
* returning customers
* geographic performance where data exists
* inventory performance
* marketing performance

Provide:

* date ranges
* comparison periods
* charts
* drill-down
* export
* responsive visualization

Add optional 3D analytics visualization only when it improves understanding.

---

# 16. BUSINESS INTELLIGENCE LAYER

Create a premium "NOVA Intelligence" area.

Examples:

* sales insights
* product insights
* customer insights
* inventory warnings
* growth opportunities
* unusual activity detection
* business KPI summaries

If AI integration is not already available, build the architecture/interface cleanly without inventing fake AI results.

Never present fabricated AI analysis as real business intelligence.

---

# 17. TEAM MANAGEMENT

Build:

* invite members
* member list
* roles
* permissions
* custom roles
* suspend/revoke access
* activity history
* organization ownership controls

Support invitation lifecycle:

pending → accepted → active → suspended → revoked.

Prevent privilege escalation.

The organization owner must not accidentally lose control of the organization.

---

# 18. INTEGRATIONS

Create an integration marketplace interface.

Categories:

* payments
* shipping
* accounting
* CRM
* analytics
* email
* SMS
* marketing
* storage
* ERP
* marketplaces

Each integration should have:

* connection state
* configuration
* permissions
* last sync
* error state
* disconnect
* reconnect

Never expose provider secrets in frontend responses.

---

# 19. DOMAIN CENTER

Create a domain-management experience inspired by hosting control panels.

Support architecture for:

* custom domains
* subdomains
* verification
* DNS instructions
* SSL status
* domain status

Flow:

Enter Domain
→ Verify
→ Configure DNS
→ Verify DNS
→ SSL
→ Connected

Do not claim SSL/domain provisioning succeeded unless backend infrastructure actually confirms it.

---

# 20. API + WEBHOOK CENTER

Build:

API Keys
Webhooks
API Usage
Request Logs
Rate Limits
Developer Documentation

Security requirements:

* hashed/recoverable secret strategy
* show secret only once where appropriate
* revoke keys
* rotate keys
* permission scopes
* audit API usage
* never log full secrets

---

# 21. SECURITY CENTER

Create a security dashboard.

Show:

* active sessions
* login history
* suspicious activity
* API keys
* security events
* organization access
* permission changes
* audit logs

Provide:

* session revocation
* password/security controls
* 2FA architecture if supported
* security notifications

Do not expose sensitive secrets.

---

# 22. AUDIT LOG

Every important organization action should generate an audit event.

Examples:

* login
* logout
* product creation
* product modification
* order status change
* refund
* member invitation
* role change
* permission change
* API key creation
* API key revocation
* integration connection
* domain modification
* billing change

Store:

* actor
* organization
* action
* resource
* resource ID
* timestamp
* IP metadata where legally/architecturally appropriate
* user agent metadata where appropriate
* success/failure

Make logs immutable from normal organization users.

---

# 23. NOTIFICATION CENTER

Build:

* system notifications
* order notifications
* inventory alerts
* security alerts
* billing notifications
* team notifications

Support:

* unread/read
* mark all read
* filtering
* notification preferences

---

# 24. BILLING / SUBSCRIPTION

Create the SaaS billing interface.

Support architecture for:

STARTER
BUSINESS
PRO
ENTERPRISE

Display:

* current plan
* usage
* limits
* renewal
* invoices
* payment method
* upgrade/downgrade
* billing history

Do not implement fake payment confirmation.

Use existing NOVA payment infrastructure where available.

---

# 25. ONBOARDING

Create a premium business onboarding flow.

Step 1:
Create Organization

Step 2:
Business information

Step 3:
Store setup

Step 4:
Branding

Step 5:
Products

Step 6:
Payments

Step 7:
Shipping

Step 8:
Team

Step 9:
Domain

Step 10:
Launch

Show a beautiful 3D progress experience without slowing onboarding.

---

# 26. RESPONSIVE DESIGN

Desktop:

Full command-center experience.

Tablet:

Condensed navigation + responsive grids.

Mobile:

* bottom navigation where appropriate
* slide-out navigation
* touch-friendly controls
* mobile tables transformed into cards
* responsive charts
* no horizontal overflow

Test:

320px
375px
390px
430px
768px
1024px
1280px
1440px
1920px+

---

# 27. MOTION SYSTEM

Create consistent motion tokens.

Use:

* page transitions
* sidebar transitions
* card hover depth
* chart animations
* modal transitions
* dropdown transitions
* skeleton shimmer
* subtle parallax
* 3D camera movement

Respect:

prefers-reduced-motion.

Never make essential information dependent on animation.

---

# 28. PERFORMANCE

3D must never destroy application performance.

Implement:

* lazy loading
* dynamic imports
* code splitting
* WebGL lazy initialization
* reduced 3D on mobile
* reduced animation on low-power devices
* optimized textures
* limited particle counts
* memoized components
* virtualized large tables where needed

Avoid unnecessary re-renders.

Maintain excellent Core Web Vitals.

---

# 29. ACCESSIBILITY

Target WCAG-conscious implementation.

Support:

* keyboard navigation
* focus management
* semantic HTML
* screen readers
* ARIA where necessary
* accessible dialogs
* accessible dropdowns
* visible focus
* sufficient contrast
* reduced motion

Do not sacrifice accessibility for 3D visuals.

---

# 30. SECURITY HARDENING

Perform a complete security audit after implementation.

Check:

* authentication
* authorization
* RBAC
* tenant isolation
* IDOR
* privilege escalation
* CSRF where relevant
* XSS
* SQL injection
* command injection
* SSRF
* insecure redirects
* file upload security
* secret exposure
* API abuse
* rate limiting
* session security
* webhook validation
* payment security
* sensitive data exposure
* mass assignment
* insecure direct object references
* race conditions

Follow OWASP principles.

Never put authorization logic exclusively in the frontend.

---

# 31. ERROR HANDLING

Every feature must have:

* loading state
* success state
* empty state
* error state
* retry state
* permission denied state
* offline/network failure handling where appropriate

Never leave blank screens.

Never silently swallow API errors.

Provide useful user-facing messages without exposing internal stack traces.

---

# 32. DATABASE / API INTEGRATION

Before changing schemas:

1. inspect current Prisma schema
2. inspect current entities
3. inspect existing migrations
4. inspect existing services/controllers
5. identify reusable relationships
6. identify missing organization relationships
7. design migration safely

Create only the minimum required new entities.

Potential entities:

Organization
OrganizationMember
OrganizationRole
Permission
RolePermission
AuditLog
Notification
ApiKey
Webhook
Subscription
Domain
Integration
DashboardPreference

Only create entities that are actually necessary.

Use proper:

* indexes
* foreign keys
* unique constraints
* cascading rules
* transaction boundaries

---

# 33. API QUALITY

Every new API endpoint must have:

* validation
* authentication
* authorization
* tenant checks
* consistent response format
* error handling
* pagination where needed
* filtering
* sorting where appropriate
* rate limiting for sensitive endpoints

Avoid N+1 queries.

Avoid returning entire database objects unnecessarily.

Use DTOs / schemas.

---

# 34. FRONTEND ARCHITECTURE

Keep the Control Center modular.

Suggested structure:

apps/web/
├── app/
│   └── control-center/
│       ├── page.tsx
│       ├── store/
│       ├── products/
│       ├── inventory/
│       ├── orders/
│       ├── customers/
│       ├── marketing/
│       ├── finance/
│       ├── analytics/
│       ├── team/
│       ├── integrations/
│       ├── domains/
│       ├── api/
│       ├── security/
│       ├── billing/
│       └── settings/
│
├── components/
│   └── control-center/
│
├── features/
│   └── control-center/
│
└── lib/

Adapt this to the existing NOVA architecture instead of blindly forcing this structure.

---

# 35. DESIGN COMPONENTS

Create reusable components:

* CommandCenterShell
* ControlSidebar
* ControlHeader
* BusinessSwitcher
* MetricCard3D
* RevenueChart
* ActivityTimeline
* InventoryHealth
* OrderTable
* CustomerTable
* ProductTable
* PermissionMatrix
* TeamTable
* SecurityPanel
* IntegrationCard
* DomainStatusCard
* UsageMeter
* BillingPlanCard
* ThreeDScene
* EmptyState
* ErrorState
* LoadingSkeleton

Keep components reusable and strongly typed.

---

# 36. 3D COMMAND CENTER EXPERIENCE

Create a signature NOVA visual experience.

Dashboard concept:

A central 3D "business ecosystem" visualization.

Nodes:

Store
Products
Orders
Customers
Inventory
Marketing
Finance

Connections represent business activity.

Example:

Customer
→ Order
→ Product
→ Inventory
→ Revenue

Allow users to hover/select a node and reveal related business metrics.

The 3D visualization must be optional and gracefully degrade to a 2D dashboard.

---

# 37. PREMIUM MICRO-INTERACTIONS

Add subtle interactions:

* cards lift slightly on hover
* charts animate into view
* numbers count smoothly
* sidebar icons respond to hover
* notifications pulse subtly
* status indicators transition
* modal entrance/exit animation
* page transitions
* contextual tooltips

Do not overanimate.

The platform must feel expensive, fast, and controlled.

---

# 38. EMPTY STATES

Every empty state should be useful.

Examples:

"No products yet"
→ Add Product

"No team members"
→ Invite Team

"No integrations"
→ Explore Integrations

"No custom domain"
→ Connect Domain

"No campaigns"
→ Create Campaign

"No analytics data"
→ Start Selling

Use elegant visual illustrations/3D scenes when appropriate.

---

# 39. DATA INTEGRITY

Never use fake production statistics.

Development/demo seed data is acceptable only when clearly isolated.

The UI must distinguish:

* real data
* demo data
* unavailable data

Never fabricate:

* revenue
* profit
* customer numbers
* AI insights
* payment status
* domain status
* subscription status

---

# 40. TESTING

Add/update:

Unit tests
Integration tests
API tests
RBAC tests
Tenant isolation tests
E2E tests
UI interaction tests

Critical tests:

1. User from Organization A cannot access Organization B.
2. Staff cannot access finance without permission.
3. Accountant cannot modify products unless permitted.
4. Suspended member cannot access organization APIs.
5. Revoked API key stops working.
6. Unauthorized user cannot access Control Center.
7. Seller cannot access another seller's organization resources.
8. Admin-only platform operations remain protected.

---

# 41. BUILD VALIDATION

Run:

* type checking
* lint
* unit tests
* integration tests
* production build
* database validation
* API validation

Fix ALL errors.

Do not hide errors with:

* @ts-ignore
* any
* disabled ESLint
* disabled TypeScript checks
* empty catch blocks
* fake fallback data

Only use exceptions when genuinely justified and documented.

---

# 42. DEPLOYMENT SAFETY

The existing NOVA deployment must continue working.

Preserve compatibility with:

* Vercel frontend
* Render API
* PostgreSQL/Supabase
* existing environment variables
* existing storage
* existing authentication
* existing API routing

Do not introduce local-only assumptions.

Check production environment compatibility.

---

# 43. FINAL UI QUALITY AUDIT

After implementation inspect every Control Center page.

Check:

* spacing
* typography
* responsive behavior
* dark/light mode
* hover states
* focus states
* loading states
* empty states
* errors
* animations
* 3D performance
* accessibility
* API integration
* authorization
* mobile usability

There must be NO unfinished placeholder pages.

---

# 44. FINAL SECURITY + BUSINESS LOGIC AUDIT

Perform a final audit for:

* broken authorization
* broken tenant isolation
* role escalation
* business logic flaws
* inconsistent order states
* payment logic issues
* inventory race conditions
* duplicate transactions
* duplicate orders
* stale dashboard metrics
* unauthorized bulk actions
* insecure file uploads
* exposed secrets
* insecure API keys
* webhook spoofing
* subscription bypass

Fix issues found.

---

# 45. EXECUTION RULE

Work incrementally.

FIRST:
Audit existing NOVA.

SECOND:
Create architecture plan.

THIRD:
Implement organization/tenant foundation.

FOURTH:
Implement Control Center shell.

FIFTH:
Implement modules.

SIXTH:
Implement 3D/motion system.

SEVENTH:
Integrate APIs/database.

EIGHTH:
Implement security/RBAC.

NINTH:
Test everything.

TENTH:
Run production build and final audit.

Do not stop after creating UI mockups.

Build the actual working product.

Do not merely describe code.

Inspect → plan → implement → test → fix → verify.

At the end provide:

1. files changed
2. database changes
3. API changes
4. frontend changes
5. new features
6. security improvements
7. tests executed
8. remaining issues, if any
9. production build result

The final result must be a **production-grade NOVA Control Center**, visually impressive with carefully controlled 3D animation, fully responsive, secure, multi-tenant, permission-aware, API-connected, and integrated with the existing NOVA Commerce platform.
