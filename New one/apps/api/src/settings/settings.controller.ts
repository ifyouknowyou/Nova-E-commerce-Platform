import { Body, Controller, Get, Patch, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import { AuthenticatedUser } from '../tenant/session.types';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get()
  @RequirePermissions('settings.read')
  @ApiOperation({ summary: 'Return organization settings.' })
  org(@Req() req: { user?: AuthenticatedUser }) {
    return this.settings.org(req.user!.orgId);
  }

  @Patch()
  @RequirePermissions('settings.update')
  @ApiOperation({ summary: 'Update organization settings (key/value pairs).' })
  updateOrg(@Req() req: { user?: AuthenticatedUser }, @Body() body: Record<string, unknown>) {
    return this.settings.updateOrg(req.user!.orgId, body);
  }

  @Get('me')
  @ApiOperation({ summary: 'Return the user’s personal preferences.' })
  me(@Req() req: { user?: AuthenticatedUser }) {
    return this.settings.me(req.user!.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update the user’s personal preferences.' })
  updateMe(@Req() req: { user?: AuthenticatedUser }, @Body() body: Record<string, unknown>) {
    return this.settings.updateMe(req.user!.userId, body);
  }
}