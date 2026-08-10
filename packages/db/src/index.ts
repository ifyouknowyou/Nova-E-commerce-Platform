import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __novaPrisma: PrismaClient | undefined;
}

/**
 * Shared Prisma client. Reuses a singleton across hot-reloads in dev to avoid
 * exhausting the connection pool during NestJS/Next.js watch mode restarts.
 */
export const prisma =
  globalThis.__novaPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__novaPrisma = prisma;
}

export * from '@prisma/client';
