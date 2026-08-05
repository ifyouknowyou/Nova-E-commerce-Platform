import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { prisma, type PrismaClient } from '@nova/db';

/**
 * Exposes the shared Prisma singleton through NestJS DI so every module can
 * inject the same client and tests can mock it at the provider boundary.
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly db: PrismaClient = prisma;

  async onModuleInit(): Promise<void> {
    await prisma.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await prisma.$disconnect();
  }
}
