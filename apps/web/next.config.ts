import type { NextConfig } from 'next';

/** Base URL of the NOVA REST API (client bundle inlines NEXT_PUBLIC_API_URL). */
const apiBase =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_INTERNAL_URL ?? 'http://localhost:4000/api';

/** Origin (scheme://host:port) of the API, allowlisted in the CSP connect-src. */
const apiOrigin = (() => {
  try {
    const u = new URL(apiBase);
    return `${u.protocol}//${u.host}`;
  } catch {
    return 'http://localhost:4000';
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  transpilePackages: ['@nova/shared'],
  images: {
    // MinIO (local) — S3/CDN hostnames added per environment in prod.
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      { protocol: 'http', hostname: '127.0.0.1', port: '9000' },
    ],
  },
  // Baseline security headers (the API already applies helmet; the webapp adds
  // these response headers for hardened browser posture).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: http://localhost:9000",
              "font-src 'self' data:",
              `connect-src 'self' ${apiOrigin} http://localhost:9000 https://js.stripe.com https://api.stripe.com ws://localhost:3000 wss://localhost:3000`,
              "frame-src https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
