import { Global, Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SecurityEventsService } from './security-events.service';
import { SecurityController } from './security.controller';

@Global()
@Module({
  controllers: [SecurityController],
  providers: [SessionService, SecurityEventsService],
  exports: [SessionService, SecurityEventsService],
})
export class SecurityModule {}
