import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RbacGuard } from './guards/rbac.guard';
import { RbacService } from './rbac.service';

/**
 * RBAC module — owns the single reusable guard. Registered APP_GUARD so every
 * route is protected by default (except @Public). JwtService + PrismaService are
 * global (AuthModule / PrismaModule), so the guard resolves them here.
 */
@Module({
  providers: [
    RbacService,
    {
      provide: APP_GUARD,
      useClass: RbacGuard,
    },
  ],
  exports: [RbacService],
})
export class RbacModule {}