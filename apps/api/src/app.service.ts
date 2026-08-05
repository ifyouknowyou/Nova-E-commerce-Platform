import { Injectable } from '@nestjs/common';

export interface AppInfo {
  name: string;
  version: string;
  docs: string;
}

@Injectable()
export class AppService {
  getInfo(): AppInfo {
    return {
      name: 'NOVA COMMERCE API',
      version: '1.0.0',
      docs: '/api/docs',
    };
  }
}
