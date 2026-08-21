import { Body, Controller, Get, HttpCode, HttpStatus, Param, Put } from '@nestjs/common';
import { Public } from '../rbac/decorators/public.decorator';
import { Roles } from '../rbac/decorators/roles.decorator';
import { Permissions } from '../rbac/decorators/permissions.decorator';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  /** Safe, non-secret platform settings used by the storefront. */
  @Get('public')
  @Public()
  getPublic() {
    return this.settings.getPublic();
  }

  @Get()
  @Roles('ADMIN')
  @Permissions('settings:manage')
  getAll() {
    return this.settings.getAll();
  }

  @Put(':group')
  @Roles('ADMIN')
  @Permissions('settings:manage')
  @HttpCode(HttpStatus.OK)
  upsert(@Param('group') group: string, @Body() body: Record<string, unknown>) {
    return this.settings.upsertGroup(group as never, body);
  }
}
