import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Global Prisma module. Uses @nexus/db's singleton `prisma` client (RLS-applied
 * `nexus_app` connection) and exposes `withTenant` for tenant-scoped work.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
