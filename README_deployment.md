# NOVA Commerce Deployment

## Browse-only storefront

The web app is a self-contained catalog with bundled sample products and local
SVG artwork. It does not require PostgreSQL, Redis, the API, or external media
storage.

```bash
cd apps/web
cp .env.example .env.local
npm run build
npm run start
```

Set `NEXT_PUBLIC_APP_URL` to the public site URL in the deployment environment.
No catalog-mode flag or database credentials are needed. The storefront
supports product browsing, search, filters, product details, and deals. Cart,
checkout, account, seller, and admin workflows are not part of this web app.

The API and database source code remain in `apps/api` and `packages/db` for
separate development; the storefront does not connect to them.
