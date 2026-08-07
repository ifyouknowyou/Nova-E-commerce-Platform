import { Global, Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { WorkflowDispatcher } from './workflow.dispatcher';
import { WorkflowRunner } from './workflow.runner';

@Global()
@Module({
  controllers: [AutomationController],
  providers: [AutomationService, WorkflowDispatcher, WorkflowRunner],
  exports: [WorkflowDispatcher],
})
export class AutomationModule {}