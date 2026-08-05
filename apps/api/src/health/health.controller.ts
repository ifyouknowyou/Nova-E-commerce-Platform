import { Controller, Get } from '@nestjs/common';
import { Public } from '../rbac/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  db: 'up' | 'down';
  uptime: number;
  timestamp: string;
}

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  async check(): Promise<HealthResponse> {
    let db: 'up' | 'down' = 'down';
    try {
      await this.prisma.db.$queryRaw`SELECT 1`;
      db = 'up';
    } catch {
      // db is down — reported below; do not leak details
    }

    return {
      status: db === 'up' ? 'ok' : 'degraded',
      db,
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }
}
