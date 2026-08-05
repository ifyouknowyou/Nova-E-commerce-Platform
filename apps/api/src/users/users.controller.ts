import { Body, Controller, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { CurrentUser } from '../rbac/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../rbac/rbac.types';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService, type UserProfileResponse } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserProfileResponse> {
    return this.users.getProfile(user.id);
  }

  @Patch('me')
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto): Promise<UserProfileResponse> {
    return this.users.updateProfile(user.id, dto);
  }

  @Get('me/security')
  security(@CurrentUser() user: AuthenticatedUser) {
    return this.users.getSecurity(user.id);
  }

  @Get('me/permissions')
  permissions(@CurrentUser() user: AuthenticatedUser) {
    return this.users.getPermissions(user.id);
  }

  @Get('me/preferences')
  preferences(@CurrentUser() user: AuthenticatedUser) {
    return this.users.getPreferences(user.id);
  }

  @Patch('me/preferences')
  @HttpCode(HttpStatus.OK)
  updatePreferences(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdatePreferencesDto) {
    return this.users.updatePreferences(user.id, dto);
  }
}
