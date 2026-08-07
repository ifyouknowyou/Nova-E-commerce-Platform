import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CsrfService } from '../common/csrf.service';
import { AuditService } from './audit.service';
import { NotificationsService } from './notifications.service';

@Global()
@Module({
  providers: [
    {
      provide: CsrfService,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new CsrfService(config.getOrThrow<string>('jwtSecret')),
    },
    AuditService,
    NotificationsService,
  ],
  exports: [CsrfService, AuditService, NotificationsService],
})
export class HooksModule {}
