import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import type { AuthenticatedUser } from '../tenant/session.types';
import { IamService, RoleDto } from './iam.service';

@ApiTags('iam')
@Controller('iam')
export class IamController {
  constructor(private readonly iamService: IamService) {}

  @Get('roles')
  @RequirePermissions('iam.roles.read')
  @ApiOperation({ summary: 'List this org’s roles and their permission sets.' })
  listRoles(@Req() req: { user?: AuthenticatedUser }): Promise<RoleDto[]> {
    return this.iamService.listRoles(req.user!.orgId);
  }
}