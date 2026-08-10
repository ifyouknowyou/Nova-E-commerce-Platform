import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CONFIG, type AppConfig } from '../config/configuration';

export const REDIS = Symbol('REDIS');

export function createRedisClient(config: AppConfig): Redis {
  return new Redis(config.redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => Math.min(times * 100, 2000),
  });
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;

  constructor(@Inject(CONFIG) config: AppConfig) {
    this.client = createRedisClient(config);
  }

  get raw(): Redis {
    return this.client;
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  /** Read a JSON value by key. Returns null when absent. */
  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  }

  /** Write a JSON value with optional TTL in seconds. */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const raw = JSON.stringify(value);
    if (ttlSeconds !== undefined) {
      await this.client.set(key, raw, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, raw);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [next, batch] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      keys.push(...batch);
    } while (cursor !== '0');
    return keys;
  }
}

export const RedisProvider = {
  provide: REDIS,
  useFactory: (config: AppConfig): Redis => createRedisClient(config),
  inject: [CONFIG],
};
