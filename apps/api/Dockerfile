# ── NOVA COMMERCE — API (NestJS) production image ──────────────────────────
FROM node:24-alpine AS base
WORKDIR /app
ENV TURBO_TELEMETRY_DISABLED=1

# Dependencies (workspace manifests only, for layer caching).
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json turbo.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/
RUN npm ci --workspace @nova/api

# Build.
FROM base AS builder
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Compile the workspace dependencies first — @nova/db and @nova/shared resolve to
# gitignored dist/ artifacts, so a clean checkout requires building them here.
RUN cd packages/db && npx prisma generate
RUN npm run build -w @nova/shared && npm run build -w @nova/db && npm run build -w @nova/api

# Runtime.
FROM node:24-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
# Workspace packages (@nova/shared, @nova/db) are symlinked from node_modules,
# but their compiled dist/ artifacts live in packages/ — they must travel to the
# runner or runtime requires fail with MODULE_NOT_FOUND.
COPY --from=builder /app/packages/shared ./packages/shared
# @nestjs/swagger is installed nested under apps/api/node_modules (peer conflict),
# so the root node_modules copy alone cannot satisfy its require at runtime.
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/db ./packages/db
# Run as a non-root user (node:alpine ships the `node` user).
RUN chown -R node:node /app
USER node
EXPOSE 4000
CMD ["node", "apps/api/dist/main.js"]