import { Global, Module } from '@nestjs/common';
import { DevMailTransport, MailService, MAIL_TRANSPORT } from './mail.service';

@Global()
@Module({
  providers: [
    { provide: MAIL_TRANSPORT, useClass: DevMailTransport },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
