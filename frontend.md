# FRONTEND-ONLY ADVANCED 3D UI/UX REDESIGN

# PROJECT: NOVA COMMERCE

IMPORTANT: THIS TASK IS FRONTEND-ONLY.

DO NOT MODIFY, REWRITE, REFACTOR, MIGRATE, OR DELETE ANY BACKEND CODE.

DO NOT MODIFY:

* Backend
* Database
* Prisma schema
* API routes
* API contracts
* Authentication
* Authorization
* RBAC
* Permissions
* JWT
* Sessions
* Business logic
* Payment logic
* Order logic
* Existing backend services
* Existing API response formats

The existing backend is considered FINAL and MUST remain unchanged.

Your job is ONLY to redesign and improve the FRONTEND.

============================================================
PRIMARY OBJECTIVE
=================

Transform the existing frontend into a premium, advanced, modern 3D e-commerce experience.

The frontend should feel like a high-end next-generation commercial application rather than a basic dashboard template.

Create an ORIGINAL visual identity.

Do NOT copy Amazon, Shopify, Apple, or any other company's exact interface, layout, branding, or proprietary visual design.

Use modern design principles while creating a unique interface.

============================================================
ROLE-SPECIFIC FRONTEND DESIGN
=============================

There are three visually distinct frontend experiences:

1. CUSTOMER
2. SELLER
3. ADMINISTRATOR

The underlying application and backend remain shared.

The frontend experience must be visually different for each role.

The authenticated user's existing backend role/permission information must determine which interface is displayed.

DO NOT change how roles are determined.

DO NOT create a new authentication system.

============================================================
CUSTOMER FRONTEND
=================

Design the customer experience around:

* Shopping
* Discovery
* Products
* Deals
* Personalization
* Simplicity
* Trust

Visual direction:

Premium 3D commerce interface

Soft depth

Layered cards

Floating product cards

Subtle glass surfaces

Large product imagery

Smooth hover effects

Interactive product previews

Elegant gradients

Modern typography

Premium whitespace

Subtle parallax

Micro-interactions

The interface should feel exciting but remain easy to use.

============================================================
CUSTOMER HOMEPAGE
=================

Create:

Premium Hero Section

Interactive Product Showcase

Featured Categories

Trending Products

Best Sellers

Flash Deals

Recommended Products

Popular Brands

Recently Viewed

Promotional Sections

Newsletter

Footer

Use subtle 3D depth between sections.

Do NOT make the page visually overloaded.

3D effects must support usability rather than distract from shopping.

============================================================
CUSTOMER PRODUCT CARDS
======================

Create advanced product cards.

Include:

Product Image

Product Name

Rating

Price

Discount

Stock Status

Wishlist Button

Quick View

Add To Cart

Product Badge

On hover:

Slight elevation

Subtle 3D tilt

Image movement

Shadow depth

Secondary product image where available

Quick action controls

Do not use aggressive rotations.

Keep the product image readable.

============================================================
CUSTOMER PRODUCT PAGE
=====================

Create a premium product experience.

Include:

Large Product Gallery

3D-style visual depth

Image Zoom

Thumbnail Navigation

Product Information

Price

Discount

Rating

Variants

Quantity

Stock

Shipping Information

Add To Cart

Buy Now

Wishlist

Reviews

Specifications

Related Products

Recently Viewed

Use smooth transitions between product images.

============================================================
CUSTOMER NAVIGATION
===================

Create a modern navigation system.

Include:

Logo

Mega Menu

Global Search

Categories

Wishlist

Cart

Notifications

Account

Use:

Glass navigation

Sticky header

Subtle blur

Depth

Hover states

Smooth dropdowns

Mobile navigation

The navigation must remain highly usable.

============================================================
CUSTOMER ACCOUNT UI
===================

Create an advanced account profile bar.

Show:

Avatar

Name

Role Badge

Account Status

Profile Completion

Dropdown

Customer-specific navigation

The customer must see:

Dashboard

Orders

Wishlist

Addresses

Reviews

Notifications

Security

Account

Never show Admin or Seller controls.

============================================================
SELLER FRONTEND
===============

The Seller Dashboard must have a DIFFERENT visual identity from the Customer Website.

It should feel like a premium business management application.

Visual direction:

3D enterprise dashboard

Professional data visualization

Layered panels

Floating widgets

Depth-based cards

Glass panels where appropriate

Advanced charts

Interactive tables

Smooth transitions

Professional analytics

============================================================
SELLER DASHBOARD
================

Create:

Revenue Overview

Sales Overview

Orders

Products

Inventory

Coupons

Reviews

Analytics

Store Settings

Notifications

Account

Dashboard cards should visually communicate:

Revenue

Orders

Products

Inventory

Conversion

Average Order Value

============================================================
SELLER 3D VISUALIZATION
=======================

Use tasteful 3D visualizations for:

Revenue

Sales

Inventory

Performance

Examples:

3D bar-style charts

Depth-based statistics cards

Layered graphs

Floating KPI panels

Interactive chart hover states

Do NOT use 3D charts when they reduce data readability.

Data accuracy is more important than visual effects.

============================================================
SELLER SIDEBAR
==============

Create a premium enterprise sidebar.

Sections:

Dashboard

Store

Products

Inventory

Orders

Coupons

Reviews

Analytics

Notifications

Account

Use:

Expandable sections

Icons

Active indicators

Hover effects

Tooltips

Smooth collapse animation

Mobile drawer

============================================================
ADMIN FRONTEND
==============

IMPORTANT:

The ADMIN DASHBOARD MUST HAVE A VISUALLY DIFFERENT DESIGN.

Do NOT simply reuse the Seller Dashboard with different menu items.

The Admin interface should feel like a powerful command center.

Visual direction:

Advanced 3D command center

Dark/modern enterprise aesthetic

Layered panels

Depth

Subtle glowing accents

Interactive analytics

System overview

High-information density

Professional monitoring interface

The Admin UI should visually communicate authority, control, monitoring, and system-wide management.

============================================================
ADMIN DASHBOARD
===============

Create an advanced command center containing:

Platform Revenue

Total Orders

Customers

Sellers

Products

Pending Approvals

Refund Requests

System Activity

Security Events

Recent Orders

Recent Users

Sales Analytics

Platform Health

============================================================
ADMIN 3D COMMAND CENTER
=======================

Use advanced visual depth for:

KPI cards

Revenue visualization

Order activity

Platform statistics

Seller statistics

System monitoring

Security status

Use subtle 3D layers.

Possible visual elements:

Floating KPI cards

Depth-based panels

Interactive graphs

Perspective-based backgrounds

Animated data transitions

Soft glow effects

Particle effects ONLY if performance remains excellent

Do not turn the dashboard into a game interface.

It must remain professional.

============================================================
ADMIN SIDEBAR
=============

Create a unique administrator navigation system.

Dashboard

Users

Sellers

Products

Categories

Brands

Orders

Coupons

Reviews

Reports

Security

Audit Logs

Settings

Account

Use collapsible groups.

Example:

COMMERCE

Products
Categories
Brands
Orders

MANAGEMENT

Users
Sellers
Reviews

ANALYTICS

Reports
Analytics

SECURITY

Security Center
Audit Logs

SYSTEM

Settings

The sidebar should visually differ from the Customer and Seller interfaces.

============================================================
ADMIN ORDER MANAGEMENT
======================

The Admin frontend must expose administrative actions ONLY when the existing backend permission data allows them.

Examples:

View Order

Update Status

Reject Order

Cancel Order

Approve Refund

Reject Refund

Force Status Update

IMPORTANT:

Do NOT create or modify backend permissions.

Read the existing permission system.

If the current authenticated administrator already has permission, display the appropriate action.

If permission is absent, hide/disable the frontend action.

Backend authorization remains the final security layer.

============================================================
ROLE-AWARE DESIGN SYSTEM
========================

Create separate visual themes:

CUSTOMER

Premium Commerce

SELLER

Premium Business

ADMIN

Premium Command Center

Do not create three completely unrelated applications.

They should share:

Typography foundation

Spacing system

Accessibility rules

Component quality

Interaction principles

But their visual identity, navigation, dashboard composition, backgrounds, cards, and visual hierarchy should be clearly different.

============================================================
3D DESIGN SYSTEM
================

Build reusable frontend primitives for:

3D Card

Floating Card

Depth Panel

Glass Panel

Perspective Container

Hover Tilt Card

Layered Card

Animated KPI Card

Floating Action Button

3D Product Card

Dashboard Widget

Interactive Chart Container

Use CSS transforms and GPU-friendly animations where possible.

Use perspective, transform, translateZ, scale, blur, and shadow carefully.

============================================================
3D PERFORMANCE RULES
====================

3D effects MUST NOT destroy performance.

Prefer:

CSS transforms

GPU-accelerated animations

opacity

transform

will-change only where justified

Lazy loading

Code splitting

Reduced motion support

Avoid excessive:

WebGL

Canvas

Particle systems

Continuous animations

Large blur filters

Heavy shaders

If WebGL/Three.js is introduced, use it only where it provides meaningful value.

Do NOT add Three.js simply because the design is called "3D".

============================================================
MOTION DESIGN
=============

Use smooth:

Page transitions

Card hover

Dropdown animation

Sidebar transitions

Modal transitions

Image transitions

Chart animations

Button feedback

Loading transitions

Use short, professional animations.

Avoid excessive bouncing or distracting movement.

Respect:

prefers-reduced-motion

============================================================
RESPONSIVE 3D DESIGN
====================

The 3D experience must work on:

Mobile

Tablet

Laptop

Desktop

Large monitors

On mobile:

Reduce perspective

Reduce heavy effects

Disable unnecessary hover interactions

Simplify complex dashboards

Keep touch targets large

Maintain readability

============================================================
ACCESSIBILITY
=============

3D effects MUST NEVER reduce accessibility.

Maintain:

WCAG AA

Keyboard navigation

Focus states

Screen reader compatibility

ARIA labels

Color contrast

Reduced motion

Readable text

Accessible buttons

Accessible forms

============================================================
FRONTEND STATE HANDLING
=======================

Use the EXISTING APIs.

Do not invent new backend endpoints.

Do not change API response formats.

Do not create fake data for production screens.

If an existing API does not provide information required by a UI element:

Do NOT modify the backend.

Instead:

1. Identify the missing data.
2. Check whether it can be derived from existing frontend data.
3. If it cannot, leave the UI gracefully degraded.
4. Report the limitation.

Never fabricate production data.

============================================================
EXISTING FUNCTIONALITY
======================

Do not break existing features.

Before modifying a component:

Understand how it currently works.

Preserve:

API calls

Authentication

Authorization

State management

Form submission

Validation

Routing

Business logic

Only improve the presentation and frontend experience.

============================================================
COMPONENT ARCHITECTURE
======================

Create reusable frontend components.

Avoid duplicate UI.

Examples:

RoleBadge

AccountBar

ProfilePanel

GlassCard

DepthCard

ProductCard

DashboardCard

StatCard

Sidebar

Navbar

MegaMenu

SearchBar

Modal

Drawer

DataTable

ChartContainer

NotificationPanel

LoadingSkeleton

EmptyState

ErrorState

============================================================
FINAL UI VALIDATION
===================

After implementation test all three experiences.

CUSTOMER:

✓ Customer homepage
✓ Customer navigation
✓ Product pages
✓ Cart
✓ Checkout
✓ Customer account
✓ Customer dashboard

SELLER:

✓ Seller dashboard
✓ Seller sidebar
✓ Seller profile
✓ Products
✓ Inventory
✓ Orders
✓ Analytics

ADMIN:

✓ Admin dashboard
✓ Admin sidebar
✓ Admin profile
✓ Users
✓ Sellers
✓ Products
✓ Orders
✓ Reports
✓ Security
✓ Audit Logs

============================================================
PERMISSION VALIDATION
=====================

Do NOT modify backend permissions.

Verify that the frontend correctly responds to the existing permission system.

Test:

Customer login

Seller login

Admin login

Different permission combinations

Unauthorized actions

Hidden navigation

Disabled actions

Direct URL access

The frontend must never assume that every Admin has every optional permission.

============================================================
STRICT BACKEND PROTECTION
=========================

This instruction has the highest priority for this task:

DO NOT MODIFY BACKEND CODE.

DO NOT MODIFY DATABASE.

DO NOT MODIFY API CONTRACTS.

DO NOT MODIFY AUTHENTICATION.

DO NOT MODIFY AUTHORIZATION.

DO NOT MODIFY RBAC.

DO NOT MODIFY PERMISSION SEEDS.

DO NOT MODIFY SERVER-SIDE BUSINESS LOGIC.

DO NOT MODIFY PAYMENT PROCESSING.

DO NOT MODIFY ORDER PROCESSING.

If a backend issue is discovered:

DO NOT FIX IT as part of this task.

Report it separately as:

BACKEND ISSUE — NO ACTION TAKEN

============================================================
FINAL OBJECTIVE
===============

The final frontend should feel like a next-generation premium e-commerce platform.

Customer:

Beautiful shopping experience.

Seller:

Powerful business workspace.

Admin:

Advanced 3D command center.

All three must feel intentionally designed rather than being the same dashboard with different menu items.

Maintain excellent:

UI/UX

Performance

Accessibility

Responsiveness

Consistency

Usability

Visual hierarchy

Security boundaries

Do not sacrifice functionality for visual effects.

============================================================
START
=====

First inspect the existing frontend architecture.

Identify:

Frontend framework

Existing routes

Existing components

Existing design system

Existing API integration

Existing authentication state

Existing role detection

Existing permission detection

Then create a FRONTEND-ONLY redesign plan.

Do not modify the backend.

Do not modify the database.

Do not start rewriting everything blindly.

Reuse working functionality wherever possible.

Implement the redesign incrementally and verify that existing functionality continues to work after every major change.
