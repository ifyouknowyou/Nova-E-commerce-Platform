import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
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
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private connected = false;

  constructor(@Inject(CONFIG) config: AppConfig) {
    this.client = createRedisClient(config);
  }

  get raw(): Redis | null {
    return this.client;
  }

  get isConnected(): boolean {
    return this.connected;
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client?.connect();
      this.connected = true;
      this.logger.log('Redis connected');
    } catch (err) {
      this.logger.warn(`Redis connection failed: ${err}. Cache features disabled.`);
      this.connected = false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.quit();
  }

  async quit(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.quit().catch(() => null);
      this.connected = false;
    }
  }

  /** Read a JSON value by key. Returns null when absent or Redis unavailable. */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.connected) return null;
    try {
      const raw = await this.client.get(key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      return null;
    }
  }

  /** Write a JSON value with optional TTL in seconds. Silently fails if Redis unavailable. */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.connected) return;
    try {
      const raw = JSON.stringify(value);
      if (ttlSeconds !== undefined) {
        await this.client.set(key, raw, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, raw);
      }
    } catch {
      // Silently fail — cache is best-effort
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client || !this.connected) return;
    try {
      await this.client.del(key);
    } catch {
      // Silently fail
    }
  }

  async scanKeys(pattern: string): Promise<string[]> {
    if (!this.client || !this.connected) return [];
    const keys: string[] = [];
    try {
      let cursor = '0';
      do {
        const [next, batch] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = next;
        keys.push(...batch);
      } while (cursor !== '0');
    } catch {
      // Silently fail
    }
    return keys;
  }
}

export const RedisProvider = {
  provide: REDIS,
  useFactory: (config: AppConfig): Redis | null => {
    try {
      return createRedisClient(config);
    } catch {
      return null;
    }
  },
  inject: [CONFIG],
};
