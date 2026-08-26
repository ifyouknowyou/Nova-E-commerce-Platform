Perform a COMPLETE production-readiness bug audit of the entire NOVA Commerce monorepo. Do not modify production data and do not change architecture unless required to fix a confirmed bug.

Audit EVERYTHING systematically:

1. FRONTEND
- All pages/routes/components
- Login/register/logout/session persistence
- Navbar, dropdowns, navigation and responsive layouts
- Product listing/details/search/filter/sort/pagination
- Categories/brands
- Cart/wishlist/checkout/orders
- Admin/seller/customer dashboards
- Forms, validation, loading/error/empty states
- Broken links, 404s, hydration/SSR issues
- API loading states, stale data, race conditions
- XSS-prone rendering and unsafe client-side state

2. BACKEND/NESTJS
- Every controller/service/module/guard/interceptor
- DTO validation and transformation
- Exception handling and HTTP status codes
- Null/undefined handling
- Race conditions and duplicate operations
- Transaction boundaries and rollback behavior
- Missing authorization checks
- ID/ownership/tenant validation
- Rate-limit and abuse protections
- Incorrect assumptions between frontend and backend

3. API AUDIT
- Enumerate every endpoint from the codebase
- Test valid/invalid/missing parameters
- GET/POST/PATCH/PUT/DELETE behavior
- Authentication-required endpoints
- ADMIN/SELLER/CUSTOMER authorization
- IDOR/BOLA/privilege escalation
- Mass assignment
- Excessive data exposure
- CORS/security headers
- Pagination/filter/sort abuse
- Duplicate requests/idempotency
- Incorrect status codes and error responses
- API/frontend contract mismatches

4. AUTH + RBAC
- Registration/login/logout
- Access-token/refresh-token lifecycle
- Expiration and rotation
- Password reset/email verification
- Session invalidation
- ADMIN/SELLER/CUSTOMER permissions
- Prevent customer→seller/admin escalation
- Prevent seller access to another seller's resources
- Prevent users modifying another user's account/order/store
- Verify authorization server-side; never trust frontend role checks

5. BUSINESS LOGIC
- Product ownership and seller ownership
- Category/brand assignment rules
- Product create/update/delete
- Inventory/stock consistency
- Cart quantity and stock validation
- Price manipulation
- Discount/tax/shipping calculations
- Checkout/order creation
- Order status transitions
- Cancellation/refund rules
- Seller order management
- Admin moderation
- Wishlist/cart consistency
- Duplicate orders and double-submit behavior
- Negative/zero quantities and invalid prices
- Deleted/disabled products/categories/brands
- Concurrency and TOCTOU issues

6. PAYMENTS
- Stripe configuration and environment handling
- Never trust client-provided prices/totals
- Server-side amount verification
- Webhook signature verification
- Duplicate webhook/idempotency handling
- Payment/order state consistency
- Failed/cancelled/pending payment handling
- Refund/cancellation edge cases
- Test-mode vs production configuration
- Never expose secret keys

7. DATABASE/PRISMA
- Schema relationships and constraints
- Foreign keys
- Unique constraints
- Nullable fields
- Cascades/deletes
- Transaction safety
- N+1 queries
- Unsafe queries
- Migration consistency
- Seed/idempotency behavior
- Data integrity under concurrent requests
- Verify Render PostgreSQL production configuration without modifying production data

8. IMAGE/S3/SUPABASE STORAGE
- Upload authorization
- File type/size validation
- Unsafe filenames/paths
- Object ownership
- Unauthorized deletion/replacement
- Public/private access behavior
- URL generation
- Missing/invalid storage configuration
- Ensure secrets never reach frontend/browser
- Do not expose service-role credentials

9. SECURITY
Run a defensive application security review for:
- OWASP Top 10
- Broken access control
- Authentication failures
- Injection
- XSS
- CSRF where applicable
- SSRF
- Path traversal
- Sensitive-data exposure
- Security misconfiguration
- Insecure direct object references
- Mass assignment
- Prototype pollution
- Open redirects
- Unsafe file upload
- Weak validation
- Secret leakage
- Debug/error information leakage
- Dependency vulnerabilities

10. ERROR/EDGE-CASE TESTING
Test:
- Empty database
- Empty API responses
- Missing records
- Deleted records
- Invalid UUID/IDs
- Very large/small values
- Duplicate requests
- Expired tokens
- Invalid tokens
- Network/API failures
- Database unavailable
- Storage unavailable
- Stripe unavailable
- Redis unavailable
- Concurrent requests
- Partial failures
- Timeout behavior

11. DEPLOYMENT/ENVIRONMENT
Verify:
- Vercel frontend: https://nova-commerce-seven.vercel.app
- Render API: https://nova-api-4k4c.onrender.com
- Render PostgreSQL production database
- Supabase Storage
- /api rewrite/proxy behavior
- Production environment variables
- CORS_ORIGIN
- API_INTERNAL_URL
- NEXT_PUBLIC_API_URL
- Stripe variables
- S3 variables
- JWT secrets
- No secrets committed to Git
- No localhost URLs accidentally used in production

12. TESTING
First inspect the repository, package scripts, existing tests, Prisma schema, routes, controllers, services, guards, frontend API clients and environment configuration.

Then:
- Run lint/typecheck
- Run all existing unit/integration tests
- Run build for every workspace
- Run Prisma validation
- Test API endpoints safely
- Test frontend routes
- Add focused regression tests for confirmed bugs
- Do not delete existing tests
- Do not weaken security checks just to make tests pass
- Do not seed/reset/drop production data
- Do not expose or print secrets/tokens/passwords

For every finding report:
[SEVERITY] CRITICAL/HIGH/MEDIUM/LOW/INFO
[TYPE] Security/API/Business Logic/Database/Frontend/Deployment/etc.
[LOCATION] exact file + line/function
[PROBLEM] what is wrong
[IMPACT] what could happen
[REPRODUCTION] safe reproduction/test
[ROOT CAUSE]
[FIX] recommended fix
[REGRESSION TEST] test that prevents recurrence

Finally produce:
1. Total findings by severity
2. CRITICAL/HIGH findings first
3. Business-logic bugs
4. API bugs
5. Authentication/RBAC bugs
6. Database bugs
7. Frontend bugs
8. Security findings
9. Deployment/configuration findings
10. Test/build failures
11. Files changed
12. Tests executed and results
13. Remaining risks

After the audit, FIX all confirmed CRITICAL and HIGH issues, then fix MEDIUM issues where safe. Preserve existing functionality and backend contracts unless a confirmed bug requires a change. Re-run the complete test/build suite after every fix and report the final status.