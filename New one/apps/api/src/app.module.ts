import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { CrmModule } from './crm/crm.module';
import { CsrfGuard } from './common/csrf.guard';
import { DashboardModule } from './dashboard/dashboard.module';
import { DocumentsModule } from './documents/documents.module';
import { FinanceModule } from './finance/finance.module';
import { HealthModule } from './health/health.module';
import { HooksModule } from './hooks/hooks.module';
import { HrModule } from './hr/hr.module';
import { IamModule } from './iam/iam.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { InventoryModule } from './inventory/inventory.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OrgsModule } from './orgs/orgs.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { RbacModule } from './rbac/rbac.module';
import { SalesModule } from './sales/sales.module';
import { SearchModule } from './search/search.module';
import { SecurityModule } from './security/security.module';
import { SettingsModule } from './settings/settings.module';
import { SupportModule } from './support/support.module';
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
    CrmModule,
    SalesModule,
    ProjectsModule,
    FinanceModule,
    DashboardModule,
    InventoryModule,
    SupportModule,
    HrModule,
    DocumentsModule,
    SearchModule,
    NotificationsModule,
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