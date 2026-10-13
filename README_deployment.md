# NOVA Commerce Deployment

## Database-free storefront deployment

To deploy the storefront as a browse-only catalog without provisioning a
database, Redis, or API service, set `NEXT_PUBLIC_CATALOG_MODE=static` in the
web app's build environment. This bundles the sample catalog and its local SVG
images into the Next.js app. The setting must be present at build time.

```bash
cd apps/web
NEXT_PUBLIC_CATALOG_MODE=static npm run build
npm run start
```

This mode supports catalog browsing, search, filters, product pages, and deals.
Cart, checkout, login, reviews, and seller/admin workflows require the full API
and database and are not available in catalog-only mode.

## Environment Variables
- Set `VERCEL_API_KEY` environment variable (already configured)
- Can be set in Claude settings: `~/.claude/settings.local.json`

## Running Locally
- API: `http://localhost:4000` (has run locally)
- Web App: `http://localhost:3001` (had run locally)

## Vercel Deployment
- Temporary deployment: `https://web-9axn3fpor-build-business.vercel.app`

## Current Status
- ✅ API and web app deployed to Vercel
- ✅ Database reset completed (safe confirmation received)
- ✅ JWT secrets configured properly
- ⚠️ Redis connection failed (cache disabled)
- ⚠️ RESEND_API_KEY not set (emails logged)

## Next Steps
1. Configure RESEND_API_KEY for email functionality
2. Check PostgreSQL migrations if starting fresh
3. Set up Redis for caching
4. Access deployed site via Vercel URL
