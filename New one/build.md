# ================================================================

# MASTER AI CODING COMMAND

# NEXUS OS — AI-NATIVE BUSINESS OPERATING SYSTEM

# FULL-STACK / ENTERPRISE / PRODUCTION-GRADE

# ================================================================

You are an elite engineering organization with 10+ years of
experience in enterprise SaaS, ERP, CRM, AI agents, security,
cloud architecture, databases, frontend engineering, UX,
DevOps, QA, and performance engineering.

Your mission is to BUILD the complete upgraded version of:

NEXUS OS
"The AI Operating System for Growing Businesses"

Do not create a demo.
Do not create a mockup.
Do not create fake functionality.

Build a real, production-oriented, scalable business platform.

================================================================
IMPORTANT: WORK DIRECTLY ON THE PROJECT
=======================================

First inspect the entire repository.

Determine:

* Existing framework
* Frontend architecture
* Backend architecture
* Database
* ORM
* Authentication
* Authorization
* API architecture
* Existing packages
* Existing components
* Existing tests
* Environment configuration
* Deployment configuration

NEVER blindly rewrite an existing project.

Preserve working functionality unless there is a verified reason
to replace it.

If the repository is empty, initialize a professional architecture.

================================================================
PRODUCT VISION
==============

NEXUS OS is an AI-native Business Operating System.

It combines:

CRM
Sales
Projects
Finance
Inventory
Support
Documents
Team Management
Analytics
Automation
AI Copilot
AI Agents
Business Intelligence
Business Graph
Notifications
Audit
Security

The core principle is:

ONE BUSINESS
ONE DATA MODEL
ONE WORKSPACE
ONE AI CONTEXT

The platform should allow a business owner to understand what is
happening in the company and what actions should be taken next.

================================================================
CORE USER TYPES
===============

Implement organization-aware multi-tenancy.

Roles:

OWNER
ADMIN
MANAGER
SALES
FINANCE
OPERATIONS
HR
SUPPORT
EMPLOYEE

Create a secure permission system.

Support:

RBAC
resource-level authorization
organization isolation
role-specific navigation
role-specific dashboards
server-side authorization
frontend permission-aware UI

Never rely on frontend permissions for security.

================================================================
CORE MODULES
============

Build these modules as independent but connected domains:

1. Dashboard
2. Organizations
3. CRM
4. Sales
5. Projects
6. Finance
7. Inventory
8. Support
9. Team / HR
10. Documents
11. Notifications
12. Analytics
13. Automation
14. AI Copilot
15. AI Agents
16. Business Graph
17. Search
18. Audit Logs
19. Security Center
20. Settings
21. Integrations

================================================================

1. EXECUTIVE DASHBOARD
   ================================================================

The dashboard must answer:

WHAT HAPPENED?
WHAT IS HAPPENING?
WHAT NEEDS ATTENTION?
WHAT SHOULD I DO NEXT?

Include:

Revenue
Expenses
Profit
Customers
Leads
Deals
Orders
Invoices
Outstanding payments
Projects
Tasks
Inventory
Support tickets
Team activity
Business alerts

Create:

KPI cards
Charts
Trend analysis
Activity timeline
Alerts
AI recommendations
Recent activity
Upcoming tasks
Business health

Do not create meaningless decorative charts.

Every visualization must communicate useful information.

================================================================
2. CRM
======

Build:

Companies
Contacts
Leads
Deals
Activities
Notes
Tasks
Tags
Communication history

Lead pipeline:

NEW
CONTACTED
QUALIFIED
PROPOSAL
NEGOTIATION
WON
LOST

Deal functionality:

Value
Probability
Expected close
Owner
Company
Contacts
Activities
Products
Notes
Documents
Timeline

Create:

Pipeline view
List view
Detail view
Activity timeline
Filters
Search
Sorting
Bulk operations

================================================================
3. SALES
========

Build:

Sales pipeline
Quotes
Products/services
Discounts
Sales targets
Forecasting
Sales activities
Follow-ups

Create revenue forecasting.

Do not fabricate forecasting data.

Clearly distinguish:

actual
projected
estimated

================================================================
4. PROJECT MANAGEMENT
=====================

Build:

Projects
Tasks
Subtasks
Milestones
Teams
Comments
Files
Time tracking
Budgets
Activity history

Views:

List
Kanban
Calendar
Timeline
Gantt

Task states:

TODO
IN_PROGRESS
BLOCKED
REVIEW
DONE

Allow configurable workflows without breaking existing data.

================================================================
5. FINANCE
==========

Build the first production-oriented finance layer:

Invoices
Invoice items
Payments
Expenses
Customers
Vendors
Financial summaries
Outstanding balances
Cash-flow overview

Invoice lifecycle:

DRAFT
SENT
PARTIALLY_PAID
PAID
OVERDUE
CANCELLED

Never represent an invoice as paid without verified payment state.

Keep financial calculations server-authoritative.

Do not allow AI to directly perform high-risk financial actions
without explicit authorization/approval.

================================================================
6. INVENTORY
============

Build:

Products
SKU
Categories
Suppliers
Warehouses
Locations
Stock
Stock movements
Purchase orders
Low-stock alerts

Track inventory changes through immutable stock movements.

Avoid race conditions and negative inventory.

================================================================
7. SUPPORT
==========

Build:

Tickets
Customers
Agents
Priority
Status
Assignment
Comments
Internal notes
Attachments
SLA
Activity timeline

Ticket states:

OPEN
IN_PROGRESS
WAITING
RESOLVED
CLOSED

Create searchable support history.

================================================================
8. TEAM / HR
============

Build:

Employees
Departments
Teams
Roles
Attendance
Leave
Tasks
Performance summaries
Employee documents

Do not expose sensitive employee information to unauthorized users.

================================================================
9. DOCUMENT MANAGEMENT
======================

Create a secure business document system.

Support:

Folders
Documents
Metadata
Tags
Ownership
Organization isolation
Versioning
Search
Preview
Download
Activity history

Validate uploads.

Do not trust client MIME types.

Apply:

size limits
extension validation
content validation
authorization
safe storage keys
access control

================================================================
10. GLOBAL SEARCH
=================

Create one unified search system.

Search:

Customers
Companies
Leads
Deals
Projects
Tasks
Invoices
Products
Tickets
Employees
Documents

Support:

instant search
filters
categories
keyboard navigation
recent searches
command palette

Eventually support natural-language queries.

Example:

"Show unpaid invoices from customers with active deals."

================================================================
11. NOTIFICATION CENTER
=======================

Create centralized notifications.

Support:

In-app
Email-ready architecture
Push-ready architecture

Events:

Invoice overdue
Deal won
Task assigned
Project delayed
Low inventory
New ticket
Payment received
Security alert
AI recommendation

Notifications must respect permissions.

================================================================
12. AUTOMATION ENGINE
=====================

Build a real workflow engine.

Structure:

TRIGGER
→ CONDITIONS
→ ACTIONS

Example:

WHEN invoice becomes overdue
IF amount > 500
THEN create finance task
AND notify finance manager

Triggers may include:

Record created
Record updated
Status changed
Payment overdue
Inventory low
Deal won
Task overdue
Scheduled time

Actions:

Create task
Update record
Send notification
Send email through existing provider abstraction
Assign user
Add tag
Create invoice
Request approval

Every workflow execution must be logged.

================================================================
13. AI COPILOT
==============

This is the centerpiece of NEXUS OS.

DO NOT build a generic chatbot.

The AI must understand authorized business context.

Examples:

"How did sales perform this month?"

"Which deals are at risk?"

"Which customers have stopped purchasing?"

"Why are expenses increasing?"

"Which invoices are overdue?"

"What should I focus on today?"

The AI should produce:

Answer
Evidence
Relevant records
Reasoning summary
Recommended actions

Never invent business data.

If data is unavailable, say so.

================================================================
14. AI TOOL SYSTEM
==================

Build controlled AI tools.

Examples:

searchCustomers
searchDeals
getSalesSummary
getInvoiceStatus
getInventoryStatus
getProjectStatus
createTask
updateTask
createNote
createDraft
generateReport

The AI must NEVER receive unrestricted database access.

Every tool call passes through:

USER
→ AI
→ INTENT
→ PERMISSION CHECK
→ DATA ACCESS POLICY
→ RISK CHECK
→ TOOL
→ RESULT
→ AUDIT LOG

================================================================
15. AI AGENTS
=============

Create an extensible agent architecture.

Initial agents:

Sales Agent
Finance Agent
Operations Agent
Support Agent
Executive Agent

Agents can:

analyze
summarize
recommend
prepare drafts
identify anomalies
create proposed actions

High-risk operations require human approval.

================================================================
16. AI APPROVAL SYSTEM
======================

Create an approval interface.

Example:

AI wants to:

Create invoice
Send customer message
Modify financial data
Change inventory
Assign sensitive permissions

Show:

WHAT WILL HAPPEN
WHY
DATA AFFECTED
EXPECTED RESULT

Buttons:

APPROVE
REJECT
EDIT

Never silently execute high-risk actions.

================================================================
17. BUSINESS GRAPH
==================

Create a relationship layer connecting business entities.

Example:

Customer
↓
Deal
↓
Product
↓
Order
↓
Invoice
↓
Payment

And:

Customer
↓
Support Ticket
↓
Issue
↓
Product
↓
Order

Represent relationships in the UI.

Create a visual Business Graph explorer.

The graph should be backed by real relationships.

Do not create decorative fake nodes.

================================================================
18. BUSINESS INTELLIGENCE
=========================

Create analytics around:

Revenue
Growth
Customers
Sales
Deals
Projects
Expenses
Inventory
Support
Team performance

Allow:

Date filtering
Comparison periods
Drill-down
Export
Saved reports

Clearly distinguish calculated values from raw values.

================================================================
19. 3D EXECUTIVE EXPERIENCE
===========================

Create an advanced frontend visual system.

Do not make every screen unnecessarily 3D.

Use three visual experiences:

EMPLOYEE
→ clean spatial workspace

MANAGER
→ analytical 3D workspace

OWNER / EXECUTIVE
→ immersive 3D command center

Use:

Depth
Perspective
Layered cards
3D KPI visualization
Parallax
Spatial charts
Interactive business graph
Floating panels
Subtle lighting
Advanced transitions
Motion
Micro-interactions

Use Three.js / React Three Fiber only where appropriate.

Performance has priority over visual effects.

================================================================
20. EMPLOYEE UI
===============

Employee interface should prioritize:

Tasks
Projects
Customers
Calendar
Messages
Notifications
Personal performance

Simple and efficient.

================================================================
21. MANAGER UI
==============

Manager interface should prioritize:

Team
Projects
Performance
Sales
Workload
Approvals
Analytics

Use richer visualization and information density.

================================================================
22. OWNER / EXECUTIVE UI
========================

Create the most advanced interface.

Build:

3D Business Command Center
Business Health
Revenue
Customers
Sales
Operations
Finance
Inventory
Projects
AI Recommendations
Business Graph

Create an immersive but readable environment.

The owner should understand the business within seconds.

================================================================
23. ADMIN UI
============

Create a completely different administrative interface.

Admin should focus on:

Organizations
Users
Roles
Permissions
Security
Audit
Integrations
System health
Feature flags
Platform configuration
AI governance

Use a high-information command-center design.

================================================================
24. DESIGN SYSTEM
=================

Create a centralized design system.

Define:

Typography
Colors
Spacing
Radius
Elevation
Depth
Motion
Shadows
Breakpoints
Dark mode
Light mode

Avoid generic AI aesthetics.

Do NOT blindly use:

Inter
Roboto
Purple gradients
Generic SaaS cards
Excessive glassmorphism
Excessive neon
Template dashboards

Create a recognizable visual identity.

================================================================
25. RESPONSIVE DESIGN
=====================

Support:

Mobile
Tablet
Laptop
Desktop
1440px
1920px
2560px+

Desktop layouts must intelligently use available screen width.

Avoid:

tiny centered content
massive empty side margins
unnecessary max-width restrictions

Dashboards should expand intelligently.

Mobile must use redesigned layouts rather than simply shrinking
desktop.

================================================================
26. ACCESSIBILITY
=================

Target WCAG AA.

Support:

Keyboard navigation
Focus management
Screen readers
ARIA
Semantic HTML
Reduced motion
Accessible forms
Accessible tables
High contrast

If prefers-reduced-motion is enabled:

reduce 3D
reduce parallax
reduce transitions
disable unnecessary continuous animation

================================================================
27. SECURITY
============

Implement defense in depth.

Protect:

Authentication
Authorization
Tenant isolation
Sessions
APIs
Uploads
Documents
AI tools
Automation
Webhooks
Audit logs

Use appropriate protections against:

XSS
CSRF
SQL injection
SSRF
command injection
IDOR
broken access control
rate abuse
credential attacks
file upload attacks
prompt injection
AI tool abuse

Never trust frontend authorization.

================================================================
28. MULTI-TENANCY
=================

Every organization must be isolated.

Test:

Organization A cannot access Organization B.

This applies to:

API
Database queries
Files
Documents
Search
AI
Analytics
Notifications
Automation
Business Graph

Tenant isolation is mandatory.

================================================================
29. AUDIT SYSTEM
================

Log security-sensitive and business-critical actions.

Record:

Actor
Organization
Action
Resource
Timestamp
IP where appropriate
Request metadata where appropriate
Result

Audit logs must not be casually editable/deletable.

================================================================
30. OBSERVABILITY
=================

Create architecture for:

Structured logs
Error tracking
Metrics
Health checks
Background job monitoring
AI tool monitoring
Workflow monitoring

Provide an admin health dashboard.

================================================================
31. API DESIGN
==============

Use clean domain APIs.

Document APIs with OpenAPI where applicable.

Use:

validation
consistent errors
pagination
filtering
sorting
authorization
rate limiting

Never expose internal database models unnecessarily.

================================================================
32. DATABASE
============

Design a normalized, scalable schema.

Core entities include:

User
Organization
Membership
Role
Permission

Company
Contact
Lead
Deal
Activity

Product
Inventory
Warehouse
Supplier
PurchaseOrder

Project
Task
Milestone

Invoice
Payment
Expense

Employee
Department

Ticket

Document

Workflow
WorkflowTrigger
WorkflowAction
WorkflowExecution

AIConversation
AIMessage
AIToolCall
AIAgent
AIApproval

Notification
AuditLog

Every entity must have appropriate:

IDs
timestamps
indexes
foreign keys
constraints
organization relationships

================================================================
33. PERFORMANCE
===============

Optimize for real-world usage.

Use:

pagination
cursor pagination where appropriate
database indexes
caching
lazy loading
code splitting
virtualization
image optimization
background jobs
efficient queries
connection pooling

Do not optimize blindly.

Measure first.

================================================================
34. TESTING
===========

Generate:

Unit tests
Integration tests
API tests
Authorization tests
Tenant-isolation tests
E2E tests
AI tool authorization tests
Workflow tests
Security tests
Accessibility tests
Performance tests

Critical flows must have regression tests.

================================================================
35. CI/CD
=========

Create CI checks for:

Lint
Type checking
Unit tests
Integration tests
E2E tests
Security checks
Dependency audit
Build
Migration validation

Do not allow known failing tests to be hidden.

================================================================
36. DEVELOPMENT WORKFLOW
========================

DO NOT implement everything in one uncontrolled operation.

Follow:

PHASE 0
Repository audit

PHASE 1
Architecture + database + security foundation

PHASE 2
Authentication + organization + RBAC

PHASE 3
CRM + Sales

PHASE 4
Projects

PHASE 5
Finance

PHASE 6
Inventory

PHASE 7
Support + Documents

PHASE 8
Search + Notifications

PHASE 9
Automation Engine

PHASE 10
AI infrastructure

PHASE 11
AI Copilot

PHASE 12
AI Agents + approvals

PHASE 13
Business Graph

PHASE 14
Analytics

PHASE 15
Advanced frontend + 3D experience

PHASE 16
Performance + accessibility

PHASE 17
Security audit

PHASE 18
Full regression testing

PHASE 19
Production readiness

================================================================
37. SELF-REVIEW LOOP
====================

Before marking ANY phase complete:

1. Inspect implementation.
2. Run tests.
3. Check authorization.
4. Check tenant isolation.
5. Check error handling.
6. Check database integrity.
7. Check performance.
8. Check accessibility.
9. Check UI consistency.
10. Search for TODOs.
11. Search for placeholders.
12. Search for fake APIs.
13. Search for mocked production behavior.
14. Identify missing functionality.
15. Fix verified problems.
16. Run tests again.

Repeat until the phase passes.

================================================================
38. NO FAKE COMPLETION
======================

NEVER say:

"Implemented"

if the feature only has:

* UI
* placeholder
* mock data
* fake API
* static JSON
* TODO
* console.log
* incomplete backend
* untested workflow

If something cannot be completed because of an external dependency,
clearly report it.

================================================================
39. NO BACKDOORS
================

Never bypass:

Authentication
Authorization
RBAC
Tenant isolation
Approval requirements
Payment state
Audit requirements

for development convenience.

================================================================
40. FINAL PRODUCT STANDARD
==========================

The final platform should feel like:

CRM
+
ERP
+
Project Management
+
Finance
+
Inventory
+
Helpdesk
+
Automation
+
Business Intelligence
+
AI Copilot
+
AI Agents
+
Business Graph

but unified into ONE coherent operating system.

The goal is not to have the most screens.

The goal is to create the most coherent business workflow.

================================================================
FINAL EXECUTION INSTRUCTION
===========================

START NOW.

First inspect the repository.

Do NOT immediately generate hundreds of files.

First produce:

1. Repository audit
2. Architecture proposal
3. Feature map
4. Domain model
5. Database design
6. Permission matrix
7. API architecture
8. AI architecture
9. Security architecture
10. Frontend architecture
11. Implementation roadmap

Then begin Phase 1.

After each phase:

BUILD
→ TEST
→ AUDIT
→ FIX
→ TEST AGAIN
→ CONTINUE

Do not stop simply because the application compiles.

The final standard is:

FUNCTIONAL
SECURE
SCALABLE
ACCESSIBLE
PERFORMANT
MAINTAINABLE
AI-NATIVE
MULTI-TENANT
PRODUCTION-ORIENTED
VISUALLY DISTINCTIVE

# Build NEXUS OS as a real product, not a generated template.

# END MASTER COMMAND

"""
