import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ApiException } from '../common/exceptions';
import { RequirePermissions } from '../rbac/decorators/rbac.decorators';
import type { AuthenticatedUser } from '../tenant/session.types';
import type { CreateIntegrationInput } from './integrations.service';
import { IntegrationsService } from './integrations.service';

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  @Get()
  @RequirePermissions('org.read')
  @ApiOperation({ summary: 'List the org’s integration registry.' })
  list(@Req() req: { user?: AuthenticatedUser }) {
    return this.integrations.list(req.user!.orgId);
  }

  @Post()
  @RequirePermissions('org.update')
  @ApiOperation({ summary: 'Register a connector.' })
  create(@Req() req: { user?: AuthenticatedUser }, @Body() body: CreateIntegrationInput) {
    return this.integrations.create(req.user!.orgId, body).catch((e) => {
      throw new ApiException('VALIDATION_FAILED', { message: e.message });
    });
  }

  @Patch(':id')
  @RequirePermissions('org.update')
  @ApiOperation({ summary: 'Update a connector.' })
  update(@Req() req: { user?: AuthenticatedUser }, @Param('id') id: string, @Body() body: Partial<CreateIntegrationInput>) {
    return this.integrations.update(req.user!.orgId, id, body);
  }

  @Delete(':id')
  @RequirePermissions('org.update')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a connector.' })
  async remove(@Req() req: { user?: AuthenticatedUser }, @Param('id') id: string) {
    await this.integrations.remove(req.user!.orgId, id);
  }

  @Post(':id/test')
  @RequirePermissions('org.update')
  @ApiOperation({ summary: 'Send a real test webhook to the connector.' })
  test(@Req() req: { user?: AuthenticatedUser }, @Param('id') id: string) {
    return this.integrations.test(req.user!.orgId, id, req.user!.userId);
  }
}