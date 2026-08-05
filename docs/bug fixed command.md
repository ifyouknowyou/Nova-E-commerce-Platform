Proceed with the remaining important fixes.

### 1. H9 — Upload Role Restriction

Fix this first.

Restrict authenticated upload functionality to:

* SELLER
* ADMIN

Customers must receive `403 Forbidden` when attempting protected uploads.

Enforce the restriction on the backend/API, not only in the frontend.

Keep the existing:

* Magic-byte validation
* File-size limits
* Per-user storage key binding
* Existing storage security

Add regression tests for:

* Customer upload → DENIED
* Seller upload → ALLOWED
* Admin upload → ALLOWED
* Unauthenticated upload → DENIED

Do not break legitimate seller/admin uploads.

### 2. M8 — httpOnly Cookie Migration

After H9 is verified, migrate authentication tokens away from:

* localStorage
* sessionStorage

Use secure `httpOnly` cookies with appropriate:

* Secure
* SameSite
* Expiration
* CSRF protection
* Refresh-token rotation
* Logout invalidation

Update the frontend API/fetch layer and SSR authentication handling as required.

Do not weaken the existing JWT expiration, tokenVersion, or account-status protections.

Add tests for:

* Login
* Authenticated requests
* Refresh
* Logout
* Token expiration
* Revocation
* Suspended account
* SSR authentication
* CSRF protection

### 3. Remaining Code Issues

After H9 and M8, fix these where practical:

* M14 → sort by effective price (`salePrice` when applicable)
* L10/M10 → prevent known default credentials from being used outside isolated development
* L1 → implement a properly tested CSP
* M16 → enforce maintenance mode
* M17 → hide deleted/private products from wishlist
* M15 → ensure role changes invalidate/update authorization state immediately

Do not spend significant effort on low-risk housekeeping until the above is complete.

### 4. External/Deployment Tasks — DO NOT PretEND THESE ARE FIXED

Report these separately as requiring external action:

* Rotate exposed Stripe test key
* Rotate exposed Twilio credentials
* Configure `STRIPE_WEBHOOK_SECRET`
* Run a real production Docker build
* Add Docker-build CI verification

Do not claim these are resolved through code changes.

### 5. Final Verification

After implementation:

Run the relevant tests.

Then run the complete security/bug audit again.

Provide:

* Fixed findings
* Remaining findings
* Tests executed
* Test results
* Files changed
* External actions still required

Do not claim the platform is fully secure or bug-free unless verified by the final audit.
