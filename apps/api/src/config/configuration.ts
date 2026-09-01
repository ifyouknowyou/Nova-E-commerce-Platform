/**
 * Typed, validated environment configuration.
 * Every value the API reads from env flows through here so missing/invalid
 * configuration fails fast at boot instead of at request time.
 */

export interface AppConfig {
  env: 'development' | 'test' | 'production';
  port: number;
  corsOrigin: string[];
  webUrl: string;
  apiUrl: string;

  databaseUrl: string;
  redisUrl: string;

  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessTtl: string;
  jwtRefreshTtl: string;
  /** Refresh-token lifetime when "Remember me" is NOT checked (short session). */
  jwtSessionTtl: string;

  googleClientId: string;
  googleClientSecret: string;
  googleCallbackUrl: string;

  mailProvider: 'resend' | 'console';
  resendApiKey?: string;
  mailFrom: string;

  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
}

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function envOr(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

/** Detect a placeholder / obviously-weak secret so config fails fast instead of silently using it. */
function assertStrongSecret(name: string, value: string): string {
  if (value.includes('change_me') || value.includes('REPLACE_WITH') || value.length < 32) {
    throw new Error(
      `${name} must be a strong random secret (>= 32 chars, not a placeholder). Generate with: openssl rand -hex 64`,
    );
  }
  return value;
}

export function loadConfig(): AppConfig {
  const env = (envOr('NODE_ENV', 'development') ?? 'development') as AppConfig['env'];

  const corsOrigin = envOr('CORS_ORIGIN', 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  // With `credentials: true`, a wildcard origin is rejected by browsers and is a
  // misconfiguration — fail fast rather than silently serving an insecure config.
  if (corsOrigin.includes('*')) {
    throw new Error('CORS_ORIGIN must be an explicit origin list; wildcard "*" is not allowed with credentials');
  }

  const jwtAccessSecret = required('JWT_ACCESS_SECRET', process.env.JWT_ACCESS_SECRET);
  const jwtRefreshSecret = required('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET);

  // Fail fast when secrets are placeholders or too short. In development the
  // placeholder value is likely intentional, but the app should not boot with it.
  if (env !== 'test') {
    assertStrongSecret('JWT_ACCESS_SECRET', jwtAccessSecret);
    assertStrongSecret('JWT_REFRESH_SECRET', jwtRefreshSecret);
  }

  // Payments must fail CLOSED in production: a missing/empty Stripe key would
  // otherwise silently fall back to the "approve everything" Mock provider.
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (env === 'production' && !stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is required in production (payment must fail closed)');
  }
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (env === 'production' && stripeSecretKey && !stripeWebhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required in production when Stripe is enabled');
  }

  return {
    env,
    port: Number(envOr('PORT', '4000')),
    corsOrigin,
    webUrl: envOr('WEB_URL', 'http://localhost:3000'),
    apiUrl: envOr('API_URL', 'http://localhost:4000'),

    databaseUrl: required('DATABASE_URL', process.env.DATABASE_URL),
    redisUrl: envOr('REDIS_URL', 'redis://localhost:6379'),

    jwtAccessSecret,
    jwtRefreshSecret,
    jwtAccessTtl: envOr('JWT_ACCESS_TTL', '15m'),
    jwtRefreshTtl: envOr('JWT_REFRESH_TTL', '14d'),
    jwtSessionTtl: envOr('JWT_SESSION_TTL', '1d'),

    googleClientId: envOr('GOOGLE_CLIENT_ID', ''),
    googleClientSecret: envOr('GOOGLE_CLIENT_SECRET', ''),
    googleCallbackUrl: envOr(
      'GOOGLE_CALLBACK_URL',
      'http://localhost:4000/api/auth/google/callback',
    ),

    mailProvider: (envOr('EMAIL_PROVIDER', 'console') === 'resend' ? 'resend' : 'console'),
    resendApiKey: process.env.RESEND_API_KEY,
    mailFrom: envOr('MAIL_FROM', 'NOVA Commerce <no-reply@nova.local>'),

    stripeSecretKey,
    stripeWebhookSecret,
  };
}

export const CONFIG = Symbol('APP_CONFIG');
export type ConfigToken = typeof CONFIG;

/** Custom provider so ConfigService returns the typed config. */
export const ConfigProvider = {
  provide: CONFIG,
  useFactory: loadConfig,
};
