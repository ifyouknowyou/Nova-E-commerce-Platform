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
  /** Phase 6 — AI layer. */
  aiApiKey: string;
  aiModel: string;
  aiApprovalTtlMs: number;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return {
    port: Number(env.API_PORT ?? 4000),
    globalPrefix: env.API_GLOBAL_PREFIX ?? 'api',
    jwtSecret: env.JWT_SECRET ?? 'dev-only-insecure-secret-change-me',
    jwtExpiresIn: env.JWT_EXPIRES_IN ?? '15m',
    dev: env.NODE_ENV !== 'production',
    aiApiKey: env.ANTHROPIC_API_KEY ?? '',
    aiModel: env.AI_MODEL ?? 'claude-opus-5',
    aiApprovalTtlMs: Number(env.AI_APPROVAL_TTL_MS ?? 24 * 60 * 60 * 1000),
  };
}