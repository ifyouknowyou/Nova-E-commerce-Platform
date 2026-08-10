import { PrismaClient } from '@prisma/client';
declare global {
    var __novaPrisma: PrismaClient | undefined;
}
/**
 * Shared Prisma client. Reuses a singleton across hot-reloads in dev to avoid
 * exhausting the connection pool during NestJS/Next.js watch mode restarts.
 */
export declare const prisma: PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export * from '@prisma/client';
//# sourceMappingURL=index.d.ts.map