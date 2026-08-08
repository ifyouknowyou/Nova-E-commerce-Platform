#!/usr/bin/env bash
# =============================================================================
# NEXUS OS — per-phase VERIFY gate (Phase 7, spec §35/§37).
#
# Runs the full build-test loop against a real Postgres and fails loudly on any
# step (no hidden failures). Used locally and by CI.
#
#   ./scripts/verify-phase.sh
#
# Environment:
#   SKIP_DB_UP=1   skip docker compose up (assume a reachable DATABASE_URL)
#   SKIP_BOOT=1    skip booting the API + health check (unit/build only)
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

log()  { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31m✖ %s\033[0m\n' "$*"; exit 1; }

# Load .env so DATABASE_URL etc. are present (does not override existing env).
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

MIGRATE_URL="${DATABASE_MIGRATE_URL:-postgresql://nexus_migrate:nexus_dev_password@localhost:5433/nexus_os?schema=public}"
DB_URL="${DATABASE_URL:-postgresql://nexus_app:nexus_dev_password@localhost:5433/nexus_os?schema=public}"

# ── 1. Database ──────────────────────────────────────────────────────────────
log "Database up"
if [ "${SKIP_DB_UP:-0}" != "1" ]; then
  docker compose up -d postgres >/dev/null 2>&1 || true
fi
# Wait for readiness (max ~60s).
ok=0
for _ in $(seq 1 60); do
  if PGPASSWORD=nexus_dev_password pg_isready -h localhost -p 5433 -U nexus_migrate -d nexus_os >/dev/null 2>&1; then
    ok=1; break
  fi
  sleep 1
done
[ "$ok" = "1" ] || fail "Postgres not reachable at localhost:5433 (set DATABASE_URL or run docker compose up -d)."

# Apply RLS bootstrap (idempotent: creates nexus_app role + grants). The init
# file is also run by docker-compose on first boot; re-running is harmless.
PGPASSWORD=nexus_dev_password psql -h localhost -p 5433 -U nexus_migrate -d nexus_os \
  -v ON_ERROR_STOP=1 -f packages/db/init/01-roles.sql >/dev/null 2>&1 || true

# ── 2. Migrate + seed ────────────────────────────────────────────────────────
log "Migrate + seed"
DATABASE_MIGRATE_URL="$MIGRATE_URL" npm run deploy -w @nexus/db >/dev/null || fail "migrate deploy"
DATABASE_MIGRATE_URL="$MIGRATE_URL" npm run db:seed >/dev/null || fail "db:seed"

# ── 3. Typecheck + lint ──────────────────────────────────────────────────────
log "Typecheck"
npm run typecheck >/dev/null || fail "typecheck"
log "Lint"
npm run lint >/dev/null || fail "lint"

# ── 4. Unit tests (api jest + web vitest) ────────────────────────────────────
log "Unit tests"
npm run test >/dev/null || fail "unit tests"

# ── 5. Build both apps ───────────────────────────────────────────────────────
log "Build"
npm run build >/dev/null || fail "build"

# ── 6. E2E tests ─────────────────────────────────────────────────────────────
log "E2E tests"
DATABASE_URL="$DB_URL" DATABASE_MIGRATE_URL="$MIGRATE_URL" npm run test:e2e >/dev/null || fail "e2e"

# ── 7. Boot + health smoke ───────────────────────────────────────────────────
if [ "${SKIP_BOOT:-0}" != "1" ]; then
  log "API health"
  (npm run start -w @nexus/api >/tmp/nexus-verify-api.log 2>&1 &) || true
  ok=0
  for _ in $(seq 1 30); do
    if curl -fsS http://localhost:4000/api/health >/dev/null 2>&1; then ok=1; break; fi
    sleep 1
  done
  [ "$ok" = "1" ] || fail "API did not become healthy (see /tmp/nexus-verify-api.log)"
  pkill -f "node dist/main.js" >/dev/null 2>&1 || true
fi

# ── 8. Three.js bundle isolation ─────────────────────────────────────────────
log "Three.js bundle check"
if grep -rl "@react-three/fiber" apps/web/.next/static/chunks/ 2>/dev/null | grep -q .; then
  shared=$(grep -rl "@react-three/fiber" apps/web/.next/static/chunks/main*.js 2>/dev/null || true)
  if [ -n "$shared" ]; then
    fail "Three.js leaked into the shared main bundle"
  fi
fi

printf '\n\033[1;32m✔ Phase verify passed — build, tests, e2e, health, 3D isolation all green.\033[0m\n'
