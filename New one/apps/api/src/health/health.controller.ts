import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../rbac/decorators/rbac.decorators';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness + DB reachability.' })
  async health(): Promise<{ status: string; db: string }> {
    let db = 'down';
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      db = 'up';
    } catch {
      db = 'down';
    }
    const status = db === 'up' ? 'ok' : 'degraded';
    return { status, db };
  }
}