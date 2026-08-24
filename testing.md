NOVA PRODUCTION DEPLOYMENT — STEPS 1–12

Complete and verify the NOVA production deployment end-to-end.

ARCHITECTURE — DO NOT CHANGE:
Vercel = Next.js frontend
Render = NestJS API
Supabase = PostgreSQL database

CURRENT PRODUCTION DOMAINS:
Frontend: https://nova-commerce-seven.vercel.app
Render API: https://nova-api-4k4c.onrender.com
Database: Supabase PostgreSQL

1. AUDIT
Audit the monorepo structure, workspaces, Next.js frontend, NestJS API, Prisma schema/migrations, API routes, vercel.json, render.yaml, and environment-variable usage. Do not change business logic.

2. RENDER CONFIG
Configure Render only for `nova-api`. Do NOT deploy `nova-web` to Render. The frontend stays on Vercel.

3. DATABASE
Verify Prisma uses `DATABASE_URL` from Render environment variables and connects to the existing Supabase PostgreSQL database. Never hardcode or expose database credentials.

4. RENDER ENVIRONMENT
Verify/document these production values:
CORS_ORIGIN=https://nova-commerce-seven.vercel.app
WEB_URL=https://nova-commerce-seven.vercel.app
API_URL=https://nova-api-4k4c.onrender.com

Also verify all existing required JWT, Stripe, Google OAuth, Resend, and S3 environment variables. Never expose or commit secrets.

5. MIGRATIONS
Ensure production uses:
npx prisma migrate deploy --schema packages/db/prisma/schema.prisma
then:
npx prisma generate --schema packages/db/prisma/schema.prisma

Never use `prisma migrate dev` against production.

6. SEED
Inspect `packages/db/prisma/seed.ts`. Determine whether it is safe for production. Do NOT add the seed command to the Render build command. If safe, provide the correct one-time production seed command without deleting existing data.

7. API BUILD
Verify:
npm ci
npm run build -w @nova/shared
npm run build -w @nova/db
npx prisma generate --schema packages/db/prisma/schema.prisma
npm run build -w @nova/api

Verify `apps/api/dist/main.js` exists.

8. API RUNTIME
Verify NestJS listens on:
process.env.PORT || 4000
and binds to:
0.0.0.0

Verify:
GET https://nova-api-4k4c.onrender.com/api/health

returns database status successfully.

9. VERCEL
Keep the existing Next.js frontend on Vercel.

Verify Vercel production environment variables:
NEXT_PUBLIC_APP_URL=https://nova-commerce-seven.vercel.app
NEXT_PUBLIC_API_URL=/api
API_INTERNAL_URL=https://nova-api-4k4c.onrender.com/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<existing configured value>

Never expose or commit `.env.local` or secrets.

10. VERCEL API PROXY
Verify `vercel.json` correctly proxies:

/api/*

to:

https://nova-api-4k4c.onrender.com/api/*

Prevent `/api/api/*` duplication and preserve all existing API endpoints.

11. PRODUCTION VERIFICATION
Test these exact URLs:

https://nova-commerce-seven.vercel.app/
https://nova-commerce-seven.vercel.app/api/health
https://nova-commerce-seven.vercel.app/api/products
https://nova-commerce-seven.vercel.app/api/categories

Also test:

https://nova-api-4k4c.onrender.com/api/health
https://nova-api-4k4c.onrender.com/api/products
https://nova-api-4k4c.onrender.com/api/categories

Confirm the complete chain:

Vercel → Render API → Supabase

12. FULL APPLICATION TEST
Verify production functionality including:
homepage
categories
products
product details
search
login
register
OAuth callback
wishlist
cart
checkout
account
seller dashboard
admin dashboard
orders
and existing API integrations.

IMPORTANT RULES:
- Do NOT change business logic.
- Do NOT redesign the frontend.
- Do NOT move the frontend from Vercel.
- Do NOT move the API from Render.
- Do NOT move the database from Supabase.
- Do NOT delete production data.
- Do NOT automatically seed on every deployment.
- Do NOT hardcode DATABASE_URL.
- Do NOT expose, print, commit, or store secrets/tokens.
- Do NOT use credentials from chat messages.
- Preserve existing working configuration.
- Make the smallest safe fix when an issue is found.
- Do not stop after finding the first issue.

At the end, report:
1. Root causes found
2. Files changed
3. Environment variables required
4. Tests performed
5. Vercel status
6. Render status
7. Supabase/database status
8. Products/categories status
9. Remaining problems
10. Exact manual commands I need to run, if any.

Complete the audit, fixes, deployment verification, and production testing before reporting completion.