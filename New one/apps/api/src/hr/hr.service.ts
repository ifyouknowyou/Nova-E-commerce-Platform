import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Team / HR — departments and employees (status-tracked). Tenant-scoped.
 */
@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  async departments(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.department.findMany({ where: { orgId }, orderBy: { name: 'asc' } }));
  }
  async createDepartment(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.department.create({ data: { ...data, orgId } as never }));
  }

  async employees(orgId: string) {
    return this.prisma.withTenant(orgId, (tx) => tx.employee.findMany({ where: { orgId }, orderBy: { lastName: 'asc' } }));
  }
  async createEmployee(orgId: string, data: Record<string, unknown>) {
    return this.prisma.withTenant(orgId, (tx) => tx.employee.create({ data: { ...data, orgId } as never }));
  }
  async setStatus(orgId: string, id: string, status: string) {
    return this.prisma.withTenant(orgId, (tx) =>
      tx.employee.update({ where: { id }, data: { status: status as never } }),
    );
  }
}