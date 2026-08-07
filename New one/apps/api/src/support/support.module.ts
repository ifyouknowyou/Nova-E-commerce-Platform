import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/rbac.module';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';

@Module({
  imports: [RbacModule],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService],
})
export class SupportModule {}