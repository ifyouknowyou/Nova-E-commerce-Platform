import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PROJECT_STATUSES, TASK_STATUSES, type ProjectStatus, type TaskStatus } from '@nexus/shared';
import { WorkflowDispatcher } from '../automation/workflow.dispatcher';
import { ApiException } from '../common/exceptions';
import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import type { AuthenticatedUser } from '../tenant/session.types';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly dispatcher: WorkflowDispatcher,
  ) {}

  @Get()
  @RequirePermissions('project.project.read')
  @ApiOperation({ summary: 'List projects with task/milestone counts.' })
  list(@Req() req: Req) {
    return this.projects.list(req.user!.orgId);
  }

  @Post()
  @RequirePermissions('project.project.create')
  @ApiOperation({ summary: 'Create a project.' })
  create(@Req() req: Req, @Body() body: Record<string, unknown>) {
    return this.projects.create(req.user!.orgId, body);
  }

  // Static routes must precede `:id` so path params don't swallow them.
  @Get('tasks/all')
  @RequirePermissions('project.task.read')
  @ApiOperation({ summary: 'List tasks (optionally for a project).' })
  tasks(@Req() req: Req, @Query('projectId') projectId?: string) {
    return this.projects.tasks(req.user!.orgId, projectId);
  }

  @Get(':id')
  @RequirePermissions('project.project.read')
  @ApiOperation({ summary: 'Project detail with tasks, milestones, members.' })
  detail(@Req() req: Req, @Param('id') id: string) {
    return this.projects.detail(req.user!.orgId, id);
  }

  @Post(':id/status')
  @RequirePermissions('project.project.update')
  @ApiOperation({ summary: 'Set project status (e.g. ACTIVE → COMPLETED).' })
  setStatus(@Req() req: Req, @Param('id') id: string, @Body() body: { status: string }) {
    if (!(PROJECT_STATUSES as readonly string[]).includes(body.status)) throw new ApiException('VALIDATION_FAILED');
    return this.projects.updateStatus(req.user!.orgId, id, body.status as ProjectStatus);
  }

  @Post(':id/milestones')
  @RequirePermissions('project.project.update')
  @ApiOperation({ summary: 'Add a milestone to a project.' })
  addMilestone(@Req() req: Req, @Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.projects.addMilestone(req.user!.orgId, { ...body, projectId: id });
  }

  @Post('milestones/:id/complete')
  @RequirePermissions('project.project.update')
  @ApiOperation({ summary: 'Mark a milestone complete.' })
  completeMilestone(@Req() req: Req, @Param('id') id: string) {
    return this.projects.completeMilestone(req.user!.orgId, id);
  }

  @Post('tasks')
  @RequirePermissions('project.task.create')
  @ApiOperation({ summary: 'Create a task (fires RECORD_CREATED automations).' })
  async createTask(@Req() req: Req, @Body() body: Record<string, unknown>) {
    const task = await this.projects.createTask(req.user!.orgId, body);
    await this.dispatcher.emit(req.user!.orgId, 'RECORD_CREATED', {
      entity: 'task', taskId: task.id, title: task.title, status: task.status, actorId: req.user!.userId,
    });
    return task;
  }

  @Post('tasks/:id/status')
  @RequirePermissions('project.task.update')
  @ApiOperation({ summary: 'Set a task status (workflow).' })
  setTaskStatus(@Req() req: Req, @Param('id') id: string, @Body() body: { status: string }) {
    if (!(TASK_STATUSES as readonly string[]).includes(body.status)) throw new ApiException('VALIDATION_FAILED');
    return this.projects.setTaskStatus(req.user!.orgId, id, body.status as TaskStatus);
  }

  @Get('tasks/:id/comments')
  @RequirePermissions('project.task.read')
  @ApiOperation({ summary: 'List comments on a task.' })
  comments(@Req() req: Req, @Param('id') id: string) {
    return this.projects.comments(req.user!.orgId, id);
  }

  @Post('tasks/:id/comments')
  @RequirePermissions('project.task.create')
  @ApiOperation({ summary: 'Add a comment to a task.' })
  addComment(@Req() req: Req, @Param('id') id: string, @Body() body: { body?: string }) {
    return this.projects.addComment(req.user!.orgId, { taskId: id, authorId: req.user!.userId, body: body.body });
  }
}

interface Req {
  user?: AuthenticatedUser;
}