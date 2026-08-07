import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { CsrfGuard } from './common/csrf.guard';
import { HealthModule } from './health/health.module';
import { HooksModule } from './hooks/hooks.module';
import { IamModule } from './iam/iam.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { MailModule } from './mail/mail.module';
import { OrgsModule } from './orgs/orgs.module';
import { PrismaModule } from './prisma/prisma.module';
import { RbacModule } from './rbac/rbac.module';
import { SecurityModule } from './security/security.module';
import { SettingsModule } from './settings/settings.module';
import { loadConfig } from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [loadConfig],
    }),
    PrismaModule,
    MailModule,
    HooksModule,
    AuthModule,
    RbacModule,
    SecurityModule,
    OrgsModule,
    SettingsModule,
    IntegrationsModule,
    IamModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
})
export class AppModule {}