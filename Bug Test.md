# ============================================================

# NOVA COMMERCE — COMPLETE BUG & SECURITY AUDIT

# FULL APPLICATION AUDIT COMMAND

# ============================================================

You are now performing a complete production-grade audit of the existing e-commerce platform.

IMPORTANT:

DO NOT immediately modify code.

First inspect the entire repository and perform a comprehensive audit.

The objective is to find bugs, vulnerabilities, broken functionality, permission problems, data integrity issues, UI problems, performance problems, and architectural weaknesses.

Do not assume that existing code is correct.

Do not trust comments or documentation without verifying the implementation.

============================================================
AUDIT SCOPE
===========

Audit EVERYTHING:

Frontend

Backend

Database

API

Authentication

Authorization

RBAC

Permissions

Customer Dashboard

Seller Dashboard

Admin Dashboard

Products

Categories

Brands

Search

Cart

Wishlist

Checkout

Payments

Orders

Refunds

Coupons

Reviews

Notifications

File Uploads

Email

Analytics

Reports

Settings

Logging

Caching

Queues

Docker

Configuration

Dependencies

CI/CD

SEO

Accessibility

Performance

Responsive Design

============================================================
PHASE 1 — REPOSITORY DISCOVERY
==============================

Inspect:

All source files

Configuration files

Environment files

Package files

Database schema

Migrations

Seed files

API routes

Frontend routes

Components

Services

Controllers

Repositories

Middleware

Guards

Hooks

Utilities

Tests

Docker files

CI/CD files

Documentation

Do not skip directories without explaining why.

Create an inventory of the application architecture.

============================================================
PHASE 2 — BUILD & RUNTIME CHECK
===============================

Verify:

Application builds successfully.

TypeScript compilation succeeds.

Linting succeeds.

Tests execute.

Frontend starts correctly.

Backend starts correctly.

Database connects.

Migrations work.

Seed process works.

Docker builds.

Docker services start.

Environment configuration works.

Check for:

Build errors

Runtime exceptions

Unhandled promises

Unhandled exceptions

Broken imports

Circular dependencies

Missing environment variables

Incorrect configuration

Port conflicts

Database connection failures

============================================================
PHASE 3 — FRONTEND BUG AUDIT
============================

Check:

Broken routes

Broken navigation

Broken links

Missing pages

Incorrect redirects

Infinite rendering

Infinite loops

Memory leaks

State synchronization bugs

Race conditions

Stale state

Incorrect loading states

Incorrect error states

Missing empty states

Form validation bugs

Incorrect form submission

Duplicate API requests

Unnecessary API requests

Broken pagination

Broken filtering

Broken sorting

Broken search

Broken modals

Broken dropdowns

Broken mobile navigation

Responsive layout problems

Overflow problems

Z-index problems

Animation problems

Hydration errors

SSR/CSR mismatches

React key problems

Missing error boundaries

Image loading problems

Broken lazy loading

============================================================
PHASE 4 — CUSTOMER FUNCTIONALITY
================================

Test:

Registration

Login

Logout

Email verification

Forgot password

Password reset

Profile

Addresses

Wishlist

Product browsing

Search

Filters

Product details

Variants

Cart

Save for later

Coupons

Checkout

Payment

Order creation

Order history

Order tracking

Cancellation

Returns

Refund requests

Reviews

Notifications

Verify edge cases such as:

Empty cart

Expired coupon

Invalid coupon

Out-of-stock product

Quantity greater than stock

Deleted product in cart

Price changed after adding to cart

Concurrent checkout

Duplicate order submission

Payment failure

Payment timeout

Network interruption

Browser refresh during checkout

============================================================
PHASE 5 — SELLER FUNCTIONALITY
==============================

Test:

Seller registration

Seller verification

Store profile

Product creation

Product editing

Product deletion

Product images

Variants

Inventory

Pricing

Orders

Order status

Tracking

Coupons

Analytics

Reviews

Store settings

Verify sellers cannot access another seller's:

Products

Orders

Inventory

Customers

Revenue

Coupons

Store settings

============================================================
PHASE 6 — ADMIN FUNCTIONALITY
=============================

Test:

Admin dashboard

User management

Seller management

Product approval

Product rejection

Product deletion

Category management

Brand management

Order management

Order rejection

Order cancellation

Refund approval

Refund rejection

Coupon management

Review moderation

Reports

Analytics

Security center

Audit logs

Settings

Verify administrative actions require the correct permission.

============================================================
PHASE 7 — AUTHENTICATION AUDIT
==============================

Check:

Registration

Login

Logout

Password hashing

Password reset

Email verification

JWT handling

Access tokens

Refresh tokens

Token expiration

Token rotation

Session invalidation

Multiple sessions

Logout all sessions

OAuth

Account takeover scenarios

Brute-force protection

Rate limiting

Session fixation

Session reuse

Expired token handling

Invalid token handling

Authentication bypass

Never expose:

Passwords

Tokens

Secrets

Private keys

Sensitive session data

============================================================
PHASE 8 — AUTHORIZATION / RBAC AUDIT
====================================

This is CRITICAL.

Build a complete permission matrix from the actual implementation.

Test:

Customer

Seller

Admin

Super Admin (if present)

For EVERY protected endpoint determine:

Who can access it?

What permission is required?

Is ownership required?

Is store ownership required?

Is the resource state validated?

Check for:

Missing authorization

Incorrect authorization

Privilege escalation

Horizontal privilege escalation

Vertical privilege escalation

IDOR / insecure direct object references

Ownership bypass

Role bypass

Permission bypass

Frontend-only authorization

Backend authorization missing

Incorrect permission inheritance

Admin-only actions exposed to sellers

Seller actions exposed to customers

Customer access to another customer's resources

Seller access to another seller's resources

IMPORTANT:

Authentication is NOT authorization.

Ownership checks are NOT a replacement for permission checks.

Frontend hiding is NOT security.

Verify authorization directly at the backend/API layer.

============================================================
PHASE 9 — API AUDIT
===================

Enumerate every API endpoint.

For each endpoint record:

HTTP method

Path

Authentication

Required permission

Input

Output

Validation

Ownership

Rate limit

Error handling

Audit logging

Check:

Missing authentication

Missing authorization

Broken validation

Mass assignment

Excessive data exposure

Incorrect HTTP methods

Improper status codes

Inconsistent responses

Duplicate endpoints

Race conditions

Pagination bugs

Filtering bypasses

Sorting abuse

Error information leakage

============================================================
PHASE 10 — DATABASE AUDIT
=========================

Inspect:

Schema

Relationships

Constraints

Indexes

Foreign keys

Unique constraints

Nullable fields

Cascade behavior

Transactions

Migrations

Soft deletion

Data consistency

Check for:

Duplicate records

Orphaned records

Missing constraints

Incorrect relations

Missing indexes

N+1 queries

Race conditions

Transaction failures

Partial writes

Data corruption risks

Incorrect decimal/money handling

Timezone problems

ID collisions

Unsafe cascade deletion

============================================================
PHASE 11 — PRODUCT & INVENTORY AUDIT
====================================

Test:

Stock validation

Negative stock

Overselling

Concurrent purchases

Quantity limits

Variant inventory

Price changes

Discount calculations

Deleted products

Disabled products

Seller inventory isolation

Admin inventory overrides

Inventory restoration after cancellation

Inventory restoration after refund

============================================================
PHASE 12 — CART & CHECKOUT AUDIT
================================

Check:

Guest cart

Authenticated cart

Cart merging

Duplicate products

Quantity changes

Price changes

Stock changes

Expired coupons

Invalid coupons

Tax calculation

Shipping calculation

Currency handling

Checkout concurrency

Duplicate checkout requests

Idempotency

Order creation

Payment/order synchronization

============================================================
PHASE 13 — PAYMENT AUDIT
========================

Audit payment integration.

Check:

Payment creation

Payment confirmation

Payment failure

Payment timeout

Refund

Partial refund

Duplicate payment

Duplicate webhook

Webhook signature verification

Webhook replay

Payment/order mismatch

Incorrect amount

Currency mismatch

Unauthorized refund

Client-side payment manipulation

Never trust payment status supplied by the frontend.

Payment status must be verified server-side.

============================================================
PHASE 14 — ORDER AUDIT
======================

Test every order state transition.

Verify illegal transitions cannot occur.

Example:

Pending → Confirmed

Confirmed → Packed

Packed → Shipped

Shipped → Delivered

Eligible → Cancelled

Eligible → Returned

Returned → Refunded

Check whether users can illegally:

Skip states

Reverse completed states

Modify another user's order

Modify another seller's order

Change price

Change payment status

Change refund amount

============================================================
PHASE 15 — SECURITY AUDIT
=========================

Audit against:

OWASP Top 10

Authentication failures

Authorization failures

Injection

XSS

CSRF

SSRF

Security misconfiguration

Sensitive data exposure

File upload vulnerabilities

Path traversal

Command injection

Mass assignment

Open redirects

CORS problems

Security headers

CSP

Cookie security

Rate limiting

Brute-force protection

Secrets exposure

Dependency vulnerabilities

Unsafe deserialization

Error leakage

Debug mode

Production configuration

Do not perform destructive testing.

Use safe, non-destructive verification.

============================================================
PHASE 16 — FILE UPLOAD AUDIT
============================

Check:

File type validation

MIME validation

Extension validation

File size

Image dimensions

Filename handling

Path traversal

Executable file upload

SVG handling

Image metadata

Storage permissions

Public/private access

Signed URLs

Virus scanning architecture

============================================================
PHASE 17 — BUSINESS LOGIC AUDIT
===============================

Look for logic flaws such as:

Negative quantities

Negative prices

Invalid discounts

Coupon abuse

Repeated coupon usage

Refund abuse

Order manipulation

Inventory manipulation

Seller isolation failures

Role escalation

Free checkout

Payment bypass

Duplicate rewards

Unauthorized review creation

Review manipulation

Account ownership bypass

============================================================
PHASE 18 — RACE CONDITION AUDIT
===============================

Look for concurrency issues involving:

Inventory

Orders

Payments

Coupons

Wallet/store credits

Refunds

Cart

User balances

Seller settlements

Use transactions/locking/idempotency where appropriate.

============================================================
PHASE 19 — PERFORMANCE AUDIT
============================

Check:

Slow database queries

N+1 queries

Large API responses

Missing pagination

Missing indexes

Unnecessary frontend renders

Large JavaScript bundles

Unoptimized images

Missing caching

Duplicate API requests

Memory leaks

Slow dashboard queries

Slow search

Slow product pages

============================================================
PHASE 20 — ACCESSIBILITY AUDIT
==============================

Check:

WCAG AA

Keyboard navigation

Focus management

ARIA

Labels

Contrast

Forms

Tables

Dialogs

Navigation

Screen readers

Reduced motion

============================================================
PHASE 21 — SEO AUDIT
====================

Check:

Metadata

Canonical URLs

Sitemap

Robots.txt

Structured data

Product schema

Breadcrumb schema

Open Graph

Page titles

Descriptions

Duplicate URLs

404 pages

Indexability

============================================================
PHASE 22 — MOBILE / RESPONSIVE AUDIT
====================================

Test:

Mobile

Tablet

Desktop

Large screens

Check:

Overflow

Navigation

Tables

Forms

Checkout

Product cards

Images

Modals

Sidebars

Touch targets

============================================================
PHASE 23 — DEPENDENCY AUDIT
===========================

Inspect dependencies for:

Known vulnerabilities

Outdated packages

Unused packages

Duplicate packages

Incompatible versions

Supply-chain risks

Lockfile problems

Do not automatically upgrade dependencies without evaluating compatibility.

============================================================
PHASE 24 — CONFIGURATION AUDIT
==============================

Check:

Environment variables

Secrets

Production configuration

Development configuration

CORS

Database configuration

Storage configuration

Payment configuration

Email configuration

Logging

Debug mode

Error reporting

============================================================
PHASE 25 — TEST COVERAGE AUDIT
==============================

Identify missing tests.

Prioritize tests for:

Authentication

Authorization

Orders

Payments

Inventory

Coupons

Refunds

Seller isolation

Admin permissions

Critical business logic

============================================================
PHASE 26 — STATIC ANALYSIS
==========================

Run appropriate:

TypeScript checks

ESLint

Dependency audit

Secret scanning

SAST

Formatting checks

Test suite

Build checks

Use tools already available in the repository.

Do not install unnecessary tools without explaining why.

============================================================
PHASE 27 — FINAL BUG CLASSIFICATION
===================================

Classify every finding:

CRITICAL

HIGH

MEDIUM

LOW

INFO

Use this guidance:

CRITICAL
Remote compromise, authentication bypass, payment bypass, catastrophic data exposure, privilege escalation.

HIGH
Serious authorization flaw, financial/business logic vulnerability, major data corruption, serious security weakness.

MEDIUM
Important functional bug, moderate security issue, significant performance problem.

LOW
Minor UI bug, edge case, small usability issue.

INFO
Improvement or hardening recommendation.

============================================================
FINAL REPORT
============

Create:

docs/COMPLETE_AUDIT.md

The report must contain:

Executive Summary

Application Architecture

Bug Summary

Security Findings

Authentication Findings

Authorization Findings

RBAC Findings

Customer Findings

Seller Findings

Admin Findings

API Findings

Database Findings

Payment Findings

Order Findings

Inventory Findings

Frontend Findings

Performance Findings

Accessibility Findings

SEO Findings

Dependency Findings

Configuration Findings

Test Coverage Findings

============================================================
FINDING FORMAT
==============

For every bug use:

ID:

Title:

Severity:

Category:

Affected Component:

Affected File:

Affected Endpoint:

Affected Role:

Description:

Root Cause:

Impact:

Proof / Evidence:

Reproduction Steps:

Expected Behavior:

Actual Behavior:

Recommended Fix:

Regression Risk:

============================================================
IMPORTANT
=========

DO NOT hide findings because they are inconvenient.

DO NOT mark something as fixed unless you actually verified the fix.

DO NOT invent vulnerabilities.

DO NOT report theoretical issues as confirmed vulnerabilities.

Clearly distinguish:

CONFIRMED

LIKELY

POTENTIAL

NOT TESTED

============================================================
NO AUTOMATIC CODE CHANGES
=========================

During the first audit:

DO NOT modify production code.

DO NOT modify database schema.

DO NOT modify permissions.

DO NOT modify API contracts.

DO NOT modify authentication.

DO NOT modify payment logic.

DO NOT modify business logic.

Only inspect, test safely, and report.

After the complete audit is finished, provide:

1. Total findings
2. Critical findings
3. High findings
4. Medium findings
5. Low findings
6. Top 10 priorities
7. Recommended remediation order
8. Files/components requiring attention
9. Missing tests
10. Architecture weaknesses

Then STOP and wait for approval before applying fixes.

============================================================
FINAL REQUIREMENT
=================

Do not declare the application "secure" simply because tests pass.

Do not declare the application "bug-free".

Your objective is to find real defects and clearly document evidence.

Perform the audit systematically across the entire platform.

START WITH DISCOVERY.

DO NOT MODIFY CODE.
DO NOT FIX ANYTHING YET.
AUDIT FIRST.
REPORT SECOND.
WAIT FOR APPROVAL.
==================
