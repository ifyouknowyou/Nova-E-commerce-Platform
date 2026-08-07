import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EMPLOYEE_STATUSES } from '@nexus/shared';
import { ApiException } from '../common/exceptions';
import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import type { AuthenticatedUser } from '../tenant/session.types';
import { HrService } from './hr.service';

@ApiTags('hr')
@Controller('hr')
export class HrController {
  constructor(private readonly hr: HrService) {}

  @Get('departments')
  @RequirePermissions('hr.employee.read')
  @ApiOperation({ summary: 'List departments.' })
  departments(@Req() req: HrReq) {
    return this.hr.departments(req.user!.orgId);
  }

  @Post('departments')
  @RequirePermissions('hr.department.update')
  @ApiOperation({ summary: 'Create a department.' })
  createDepartment(@Req() req: HrReq, @Body() body: Record<string, unknown>) {
    return this.hr.createDepartment(req.user!.orgId, body);
  }

  @Get('employees')
  @RequirePermissions('hr.employee.read')
  @ApiOperation({ summary: 'List employees.' })
  employees(@Req() req: HrReq) {
    return this.hr.employees(req.user!.orgId);
  }

  @Post('employees')
  @RequirePermissions('hr.employee.create')
  @ApiOperation({ summary: 'Create an employee.' })
  createEmployee(@Req() req: HrReq, @Body() body: Record<string, unknown>) {
    return this.hr.createEmployee(req.user!.orgId, body);
  }

  @Post('employees/:id/status')
  @RequirePermissions('hr.employee.update')
  @ApiOperation({ summary: 'Set an employee status.' })
  setStatus(@Req() req: HrReq, @Param('id') id: string, @Body() body: { status: string }) {
    if (!(EMPLOYEE_STATUSES as readonly string[]).includes(body.status)) throw new ApiException('VALIDATION_FAILED');
    return this.hr.setStatus(req.user!.orgId, id, body.status);
  }
}

interface HrReq {
  user?: AuthenticatedUser;
}