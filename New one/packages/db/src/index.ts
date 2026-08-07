/**
 * NEXUS OS — Prisma client singleton (runtime).
 *
 * Connects as the RLS-applied `nexus_app` role (DATABASE_URL). All tenant access
 * goes through `tenantClient(orgId)` which opens a transaction and sets the
 * `app.org` config BEFORE any query, so Postgres RLS scopes every row. Fail
 * closed: with an empty/unset org the config resolves to ''. (The policy uses
 * current_setting, so a missing claim yields zero rows for empty-string orgs.)
 */
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/** Run `work` inside a transaction scoped to orgId via Postgres RLS. */
export async function withTenant<T>(
  orgId: string,
  work: (tx: PrismaClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.org', ${orgId}, true)`;
    return work(tx as PrismaClient);
  });
}

/**
 * Run `work` inside a transaction scoped to a single USER context — used only
 * at sign-in to discover which orgs a user belongs to. The membership
 * `self_read` policy matches on `app.user_id` so a user can read their own
 * memberships across orgs without ever having an org claim.
 */
export async function withUserContext<T>(
  userId: string,
  work: (tx: PrismaClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
    return work(tx as PrismaClient);
  });
}

export type TenantPrismaClient = PrismaClient;