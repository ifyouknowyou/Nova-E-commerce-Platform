import { Module } from '@nestjs/common';
import { CrmModule } from '../crm/crm.module';
import { FinanceModule } from '../finance/finance.module';
import { InventoryModule } from '../inventory/inventory.module';
import { ProjectsModule } from '../projects/projects.module';
import { SupportModule } from '../support/support.module';
import { RbacModule } from '../rbac/rbac.module';
import { AiController } from './ai.controller';
import { AgentService } from './agents/agent.service';
import { ApprovalService } from './approval/approval.service';
import { CopilotService } from './copilot/copilot.service';
import { BusinessGraphService } from './graph/business-graph.service';
import { DeterministicProvider } from './provider/deterministic.provider';
import { LlmProviderFactory } from './provider/llm.factory';
import { ToolRegistry } from './tools/tool.registry';
import { ToolRunner } from './tools/tool.runner';

/**
 * Phase 6 — AI Layer & Business Graph. Imported business modules export their
 * services so tools can call real business logic (tenant-scoped via withTenant).
 */
@Module({
  imports: [CrmModule, FinanceModule, InventoryModule, ProjectsModule, SupportModule, RbacModule],
  controllers: [AiController],
  providers: [
    DeterministicProvider,
    LlmProviderFactory,
    ToolRegistry,
    ToolRunner,
    ApprovalService,
    CopilotService,
    AgentService,
    BusinessGraphService,
  ],
  exports: [ApprovalService, CopilotService, AgentService, BusinessGraphService, ToolRunner],
})
export class AiModule {}
