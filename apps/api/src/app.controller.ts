import { Controller, Get } from '@nestjs/common';
import { Public } from './rbac/decorators/public.decorator';
import { AppService, type AppInfo } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  getInfo(): AppInfo {
    return this.appService.getInfo();
  }
}
