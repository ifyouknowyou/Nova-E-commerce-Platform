import { Global, Module } from '@nestjs/common';
import { ConfigProvider } from '../config/configuration';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [ConfigProvider, RedisService],
  exports: [RedisService, ConfigProvider],
})
export class RedisModule {}
