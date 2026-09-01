
Upgrade NOVA Commerce Platform by building a complete enterprise-grade "NOVA Control Center" (C-Panel).

GOAL:
Create a secure, production-ready admin control center for managing the entire NOVA e-commerce/marketplace ecosystem.

IMPORTANT:
- Inspect the existing NOVA codebase first and integrate with the current architecture.
- Reuse existing APIs, authentication, database models, components, and design system wherever possible.
- Do NOT break existing customer or seller functionality.
- Do NOT create fake/mock data where real API/database data already exists.
- Preserve existing deployment configuration.
- Keep customer dashboard, seller dashboard, and admin Control Center properly separated.

CONTROL CENTER ROUTES:
 /admin
 /admin/orders
 /admin/products
 /admin/inventory
 /admin/customers
 /admin/sellers
 /admin/categories
 /admin/brands
 /admin/promotions
 /admin/reviews
 /admin/payments
 /admin/payouts
 /admin/shipping
 /admin/analytics
 /admin/cms
 /admin/support
 /admin/users
 /admin/roles
 /admin/security
 /admin/audit-logs
 /admin/settings

CORE FEATURES:
1. Overview Dashboard
   - Revenue
   - Orders
   - Customers
   - Sellers
   - Products
   - Inventory alerts
   - Recent orders
   - Sales analytics
   - System alerts

2. Product Management
   - CRUD products
   - Categories/subcategories
   - Brands
   - Variants
   - Pricing
   - Inventory
   - Product status
   - Bulk actions
   - Search/filter/sort

3. Order Management
   - Order list/details
   - Status management
   - Payment status
   - Shipping status
   - Cancellation/refund workflows
   - Customer/order history

4. Seller Management
   - Seller list
   - Seller profile
   - Approval/rejection
   - Verification status
   - Seller products
   - Commission configuration
   - Payout status
   - Seller suspension/deactivation

5. Customer Management
   - Customer profiles
   - Orders
   - Wishlist/cart information where permitted
   - Account status
   - Support history

6. Finance
   - Transactions
   - Revenue
   - Refunds
   - Seller commissions
   - Payouts
   - Payment status
   - Financial reporting

7. Promotions
   - Coupons
   - Discount rules
   - Campaigns
   - Promotional banners
   - Start/end dates
   - Usage limits

8. Reviews & Moderation
   - Review management
   - Reported reviews
   - Moderation actions
   - Product ratings

9. Analytics
   - Revenue trends
   - Order trends
   - Customer growth
   - Seller performance
   - Product performance
   - Category performance
   - Inventory analytics

10. CMS
   - Homepage sections
   - Banners
   - Announcements
   - FAQs
   - Static pages
   - Featured products/categories

11. Security
   - Role-based access control
   - Permission management
   - Admin sessions
   - Login/security events
   - Audit logs
   - Sensitive-action confirmation
   - Never expose secrets or credentials in the frontend

12. Settings
   - Store settings
   - Payment settings
   - Shipping settings
   - Tax settings
   - Notification settings
   - Platform configuration

UI/UX:
- Create a premium enterprise NOVA Control Center.
- Dark futuristic visual language.
- Glassmorphism + dark minimalism + subtle 3D/spatial elements.
- Professional typography and strong visual hierarchy.
- Responsive layout.
- Persistent admin sidebar.
- Top command/search bar.
- Breadcrumbs.
- Data tables with advanced filtering.
- Interactive charts.
- KPI cards.
- Status badges.
- Empty/loading/error states.
- Skeleton loaders.
- Toast notifications.
- Modal/drawer workflows.
- Confirmation dialogs for destructive actions.
- Smooth but restrained animations.
- Do NOT overuse 3D effects or animations where they reduce usability.
- Maintain accessibility and keyboard navigation.

ARCHITECTURE:
- Follow the existing NOVA Next.js/React/TypeScript architecture.
- Create reusable admin components instead of duplicating UI.
- Keep API calls centralized and typed.
- Add proper loading/error handling.
- Protect every admin route with server-side authorization.
- Never rely only on frontend role checks.
- Enforce permissions at the API/backend layer.
- Prevent SELLER/CUSTOMER users from accessing admin functionality.
- Ensure ADMIN permissions cannot be escalated from the client.

DATA:
- Connect the Control Center to the existing NOVA API/database.
- Use existing products, categories, brands, orders, users, sellers, and authentication data.
- Add only the backend/database changes genuinely required for missing Control Center functionality.
- Keep migrations safe and backward compatible.
- Do not delete existing production data.

QUALITY & SECURITY AUDIT:
After implementation:
- Run TypeScript checks.
- Run ESLint.
- Run production build.
- Test every admin route.
- Test unauthorized access.
- Test role/permission boundaries.
- Test CRUD operations.
- Test API error states.
- Test responsive layouts.
- Check console errors.
- Check broken links/routes.
- Remove unused components/imports/code created during the upgrade.
- Fix business-logic vulnerabilities.
- Check OWASP Top 10 relevant issues.
- Verify no secrets, tokens, credentials, or sensitive data are exposed in client-side code.

FINAL REQUIREMENT:
Do not merely create a visual prototype. Build the Control Center as a real integrated NOVA administration system using the existing project architecture and real data.

Before finishing, provide a concise summary of:
1. Files/components created or modified
2. Routes added
3. API/backend changes
4. Database changes
5. Security improvements
6. Tests/build results
7. Any remaining issues


