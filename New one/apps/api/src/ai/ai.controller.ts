import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiException } from '../common/exceptions';
import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import { requireUser, AuthenticatedUser } from '../tenant/session.types';
import { AgentService } from './agents/agent.service';
import { ApprovalService } from './approval/approval.service';
import { CopilotService } from './copilot/copilot.service';
import { BusinessGraphService } from './graph/business-graph.service';

interface AiReq {
  user?: AuthenticatedUser;
}

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(
    private readonly copilot: CopilotService,
    private readonly agents: AgentService,
    private readonly approvals: ApprovalService,
    private readonly graph: BusinessGraphService,
  ) {}

  // ── Copilot ─────────────────────────────────────────────────────────────────
  @Post('copilot')
  @RequirePermissions('ai.copilot.ask')
  @ApiOperation({ summary: 'Ask the AI copilot a question; acts on real tenant data.' })
  async askCopilot(@Req() req: AiReq, @Body() body: Record<string, unknown>) {
    const user = requireUser(req);
    const message = String(body.message ?? '').trim();
    if (!message) throw new ApiException('VALIDATION_FAILED', { message: 'message is required' });
    return this.copilot.ask(user.orgId, user.userId, message, body.conversationId ? String(body.conversationId) : undefined);
  }

  @Get('copilot/conversations')
  @RequirePermissions('ai.copilot.read')
  @ApiOperation({ summary: 'List the caller’s copilot conversations.' })
  async conversations(@Req() req: AiReq) {
    const user = requireUser(req);
    return this.copilot.listConversations(user.orgId, user.userId);
  }

  @Get('copilot/conversations/:id')
  @RequirePermissions('ai.copilot.read')
  @ApiOperation({ summary: 'Read one copilot conversation + messages.' })
  async conversation(@Req() req: AiReq, @Param('id') id: string) {
    const user = requireUser(req);
    return this.copilot.conversation(user.orgId, id, user.userId);
  }

  // ── Agents ───────────────────────────────────────────────────────────────────
  @Get('agents')
  @RequirePermissions('ai.agent.run')
  @ApiOperation({ summary: 'List available AI agents.' })
  async agentList() {
    return this.agents.list();
  }

  @Post('agents/:key/run')
  @RequirePermissions('ai.agent.run')
  @ApiOperation({ summary: 'Run an agent with a brief; high-risk actions require approval.' })
  async runAgent(@Req() req: AiReq, @Param('key') key: string, @Body() body: Record<string, unknown>) {
    const user = requireUser(req);
    const prompt = String(body.prompt ?? '');
    if (!prompt.trim()) throw new ApiException('VALIDATION_FAILED', { message: 'prompt is required' });
    return this.agents.run(user.orgId, key, user.userId, prompt);
  }

  @Get('agents/runs')
  @RequirePermissions('ai.agent.run')
  @ApiOperation({ summary: 'List agent runs.' })
  async agentRuns(@Req() req: AiReq) {
    const user = requireUser(req);
    return this.agents.runs(user.orgId);
  }

  // ── Approvals ────────────────────────────────────────────────────────────────
  @Get('approvals')
  @RequirePermissions('ai.approval.read')
  @ApiOperation({ summary: 'List AI approval requests (auto-expires orphans).' })
  async approvalList(@Req() req: AiReq) {
    const user = requireUser(req);
    return this.approvals.list(user.orgId, user.userId);
  }

  @Get('approvals/:id')
  @RequirePermissions('ai.approval.read')
  @ApiOperation({ summary: 'Get one approval request.' })
  async approvalDetail(@Req() req: AiReq, @Param('id') id: string) {
    const user = requireUser(req);
    return this.approvals.get(user.orgId, id);
  }

  @Post('approvals/:id/decide')
  @RequirePermissions('ai.approval.decide')
  @ApiOperation({ summary: 'Approve / reject / edit an AI approval request.' })
  async approvalDecide(
    @Req() req: AiReq,
    @Param('id') id: string,
    @Body() body: { action?: string; editInput?: Record<string, unknown> },
  ) {
    const user = requireUser(req);
    const action = body.action ?? 'approve';
    if (!['approve', 'deny', 'edit'].includes(action)) {
      throw new ApiException('VALIDATION_FAILED', { message: 'action must be approve | deny | edit' });
    }
    return this.approvals.decide(user.orgId, id, action as 'approve' | 'deny' | 'edit', user.userId, body.editInput);
  }

  // ── Business Graph ───────────────────────────────────────────────────────────
  @Get('graph')
  @RequirePermissions('ai.graph.read')
  @ApiOperation({ summary: 'Business Graph snapshot — real nodes/edges, tenant-scoped.' })
  async graphSnapshot(@Req() req: AiReq) {
    const user = requireUser(req);
    return this.graph.snapshot(user.orgId, user.userId);
  }
}