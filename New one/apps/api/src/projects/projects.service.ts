import { Injectable } from '@nestjs/common';
import { TaskStatus } from '@nexus/shared';
import { PrismaService } from '../prisma/prisma.service';
import { ApiException } from '../common/exceptions';

/**
 * Projects — projects, members, milestones, tasks (with status transitions),
 * task comments. All tenant-scoped via withTenant.
 */
@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Projects --------------------------------------------------------------
  async list(orgId: string) {
    return this.prisma.withTenant(orgId, async (tx) => {
      const projects = await tx.project.findMany({ where: { orgId }, orderBy: { createdAt: 'desc' } });
      const taskCounts = await tx.task.groupBy({ by: ['projectId'], where: { orgId }, _count: true });
      const milestoneCounts = await tx.milestone.groupBy({ by: ['projectId'], where: { orgId }, _count: true });
      const tc = Object.fromEntries(taskCounts.map((t) => [t.projectId ?? '', t._count]));
      const mc = Object.fromEntries(milestoneCounts.map((m) => [m.projectId ?? '', m._count]));
      return projects.map((p) => ({ ...p, taskCount: tc[p.id] ?? 0, milestoneCount: mc[p.id] ?? 0 }));
    });
  }

  async create(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.project.create({ data: { ...data, orgId } as never }));
  }

  async detail(orgId: string, id: string) {
    const project = await this.prisma.withTenant(orgId, (tx) => tx.project.findFirst({ where: { id, orgId } }));
    if (!project) throw new ApiException('NOT_FOUND');
    const [tasks, milestones, members] = await this.prisma.withTenant(orgId, (tx) =>
      Promise.all([
        tx.task.findMany({ where: { orgId, projectId: id }, orderBy: { createdAt: 'desc' } }),
        tx.milestone.findMany({ where: { orgId, projectId: id }, orderBy: { dueDate: 'asc' } }),
        tx.projectMember.findMany({ where: { orgId, projectId: id } }),
      ]),
    );
    return { ...project, tasks, milestones, members };
  }

  async updateStatus(orgId: string, id: string, status: string) {
    const project = await this.prisma.withTenant(orgId, (tx) => tx.project.findFirst({ where: { id, orgId } }));
    if (!project) throw new ApiException('NOT_FOUND');
    return this.prisma.withTenant(orgId, (tx) => tx.project.update({ where: { id }, data: { status: status as never } }));
  }

  // ---- Milestones ------------------------------------------------------------
  async addMilestone(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.milestone.create({ data: { ...data, orgId } as never }));
  }

  async completeMilestone(orgId: string, id: string) {
    const m = await this.prisma.withTenant(orgId, (tx) => tx.milestone.findFirst({ where: { id, orgId } }));
    if (!m) throw new ApiException('NOT_FOUND');
    return this.prisma.withTenant(orgId, (tx) => tx.milestone.update({ where: { id }, data: { completedAt: new Date() } }));
  }

  // ---- Tasks -----------------------------------------------------------------
  async tasks(orgId: string, projectId?: string) {
    return this.prisma.withTenant(orgId, (tx) =>
      tx.task.findMany({ where: { orgId, ...(projectId ? { projectId } : {}) }, orderBy: { createdAt: 'desc' } }),
    );
  }

  async createTask(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.task.create({ data: { ...data, orgId } as never }));
  }

  async setTaskStatus(orgId: string, id: string, status: TaskStatus) {
    const task = await this.prisma.withTenant(orgId, (tx) => tx.task.findFirst({ where: { id, orgId } }));
    if (!task) throw new ApiException('NOT_FOUND');
    return this.prisma.withTenant(orgId, (tx) => tx.task.update({ where: { id }, data: { status } }));
  }

  async addComment(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.taskComment.create({ data: { ...data, orgId } as never }));
  }

  async comments(orgId: string, taskId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.taskComment.findMany({ where: { orgId, taskId }, orderBy: { createdAt: 'asc' } }));
  }
}