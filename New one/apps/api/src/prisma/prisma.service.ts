import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { prisma, withTenant } from '@nexus/db';

/**
 * Wraps the RLS-applied @nexus/db Prisma singleton for NestJS lifecycle
 * management, and re-exports the tenant-scoped transaction helper.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  get client() {
    return prisma;
  }

  /** Run `work` inside a transaction scoped to orgId (Postgres RLS). */
  withTenant<T>(orgId: string, work: (tx: typeof prisma) => Promise<T>): Promise<T> {
    return withTenant<T>(orgId, work);
  }

  async onModuleInit(): Promise<void> {
    await prisma.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await prisma.$disconnect();
  }
}