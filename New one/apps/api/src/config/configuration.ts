/**
 * NEXUS OS — typed environment configuration.
 * Central loader for every secret/setting the API needs.
 */
export interface ApiConfig {
  port: number;
  globalPrefix: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  dev: boolean;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return {
    port: Number(env.API_PORT ?? 4000),
    globalPrefix: env.API_GLOBAL_PREFIX ?? 'api',
    jwtSecret: env.JWT_SECRET ?? 'dev-only-insecure-secret-change-me',
    jwtExpiresIn: env.JWT_EXPIRES_IN ?? '15m',
    dev: env.NODE_ENV !== 'production',
  };
}