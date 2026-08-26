Perform a COMPLETE end-to-end audit of the deployed NOVA frontend and fix every frontend feature that is not working.

Production frontend:
https://nova-commerce-seven.vercel.app

Production API:
https://nova-api-4k4c.onrender.com

IMPORTANT: The production API is currently healthy:
GET /api/health -> {"status":"ok","db":"up"}
GET /api/products -> 8 products
GET /api/categories -> categories + subcategories

Therefore do NOT assume the database or API is empty. Trace the actual frontend problem.

Audit the entire frontend from the root layout through every page, component, hook, API client, authentication provider, navbar, sidebar, dropdown and route.

Check and fix:

- Products not appearing
- Product cards/details
- Categories/subcategories not appearing
- Brands
- Search
- Filters
- Sorting
- Pagination
- Sign In/Login visibility
- Register
- Logout
- Authentication/session state
- Admin UI
- Seller UI
- Customer UI
- Cart
- Wishlist
- Checkout
- Orders
- Product management
- Category/brand management
- Image upload/display
- Navbar dropdowns
- Account menus
- Dashboard navigation
- All buttons and links
- Loading states
- Empty states
- Error states
- Mobile/responsive UI

For every feature, trace:

UI -> frontend hook -> apiFetch/client -> /api/* -> Vercel rewrite -> Render API -> response -> state -> rendered component.

Specifically inspect:
- useAuthenticated
- auth/session provider
- apiFetch
- React Query/SWR/state management if present
- Next.js server/client component boundaries
- hydration mismatches
- useEffect dependencies
- incorrect loading states
- incorrect empty-state conditions
- response-shape mismatches
- API URL/environment variables
- Vercel rewrite configuration
- caching
- conditional rendering
- role/permission checks
- CSS classes that hide content
- z-index/overflow/display issues
- broken dynamic routes
- browser console errors
- failed network requests

Do NOT rewrite or replace the backend because the production API is already returning valid data. Only modify backend code if you can prove a specific backend defect is causing a frontend failure.

Test every important route and feature. Use the real production API response shapes rather than assuming the API is empty.

Create a feature matrix:

FEATURE | ROUTE | API | RESPONSE | FRONTEND STATE | UI RESULT | ROOT CAUSE | FIX

Then fix every confirmed issue.

Run:
- npm install/check dependencies if necessary
- typecheck
- lint
- existing tests
- production build
- route verification
- API integration checks
- authentication checks
- browser/client-side error checks

After fixing:
1. Rebuild production frontend.
2. Verify Products display.
3. Verify Categories display.
4. Verify Sign In is clearly visible for logged-out users.
5. Verify Login/Register.
6. Verify authenticated navbar state.
7. Verify Admin/Seller/Customer navigation.
8. Verify product/category API rendering.
9. Verify image URLs/rendering.
10. Verify no console/runtime errors.
11. Review git diff for regressions.
12. Never expose, hardcode, or commit secrets.
13. Commit all confirmed fixes with a clear commit message.
14. Push to master.

Do not declare the project fixed merely because the API returns 200. Verify that the actual frontend renders and allows the user to interact with every feature.