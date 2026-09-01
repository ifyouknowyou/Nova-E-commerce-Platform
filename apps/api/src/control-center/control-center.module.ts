import { Module } from '@nestjs/common';
import { ControlCenterController } from './control-center.controller';
import { ControlCenterService } from './control-center.service';
import { OrganizationModule } from '../organization/organization.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, OrganizationModule],
  controllers: [ControlCenterController],
  providers: [ControlCenterService],
  exports: [ControlCenterService],
})
export class ControlCenterModule {}
