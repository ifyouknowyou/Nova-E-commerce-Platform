import type { NextConfig } from 'next';

/**
 * Base URL of the NOVA REST API.
 * — Browser bundle: NEXT_PUBLIC_API_URL (set to "/api" for single-domain deploy)
 * — Server (RSC):   API_INTERNAL_URL  (set to "http://nova-api:4000" on Render)
 */
const apiBase =
  process.env.NEXT_PUBLIC_API_URL ?? process.env.API_INTERNAL_URL ?? 'http://localhost:4000/api';

/**
 * Origin (scheme://host) used in the CSP connect-src directive.
 * For single-domain Render deploy this resolves to "https://yourdomain.com".
 */
const apiOrigin = (() => {
  try {
    const u = new URL(apiBase);
    return `${u.protocol}//${u.host}`;
  } catch {
    // Relative path ("/api") or missing value — allow self for same-origin proxy.
    return 'self';
  }
})();

/** Internal API base for server-side Next.js rewrites. */
const apiInternalBase = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

/**
 * Media host(s) for product/store imagery. Product images are served from an
 * S3-compatible store (MinIO in dev, public S3/Spaces in prod). We derive
 * remotePatterns + CSP img-src entries from this so next/image can optimize
 * them and the browser is allowed to load them. Comma-separate multiple hosts.
 */
const mediaOrigins = (process.env.NEXT_PUBLIC_MEDIA_URL ?? 'http://localhost:9000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((raw) => {
    try {
      return new URL(raw);
    } catch {
      return null;
    }
  })
  .filter((u): u is URL => u !== null);

const mediaRemotePatterns = mediaOrigins.map((u) => ({
  protocol: u.protocol.replace(':', '') as 'http' | 'https',
  hostname: u.hostname,
  port: u.port,
  pathname: '/**',
}));

const mediaCspSources = mediaOrigins.map((u) => `${u.protocol}//${u.host}`);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  transpilePackages: ['@nova/shared'],
  images: {
    remotePatterns: [
      // Derived from NEXT_PUBLIC_MEDIA_URL (MinIO/S3/Spaces). Falls back to dev MinIO.
      ...mediaRemotePatterns,
      // Local MinIO (dev) — kept for legacy/env-less runs.
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      { protocol: 'http', hostname: '127.0.0.1', port: '9000' },
      // Production S3 — add your bucket hostname here or via env if needed.
      // Example for AWS S3: { protocol: 'https', hostname: 'your-bucket.s3.amazonaws.com' }
      // Example for Render Spaces / DigitalOcean: { protocol: 'https', hostname: 'nova-media.nyc3.digitaloceanspaces.com' }
    ],
  },

  /**
   * Proxy all /api/* requests to the internal NestJS service.
   * On Render the browser calls https://yourdomain.com/api/... and Next.js
   * transparently forwards them to http://nova-api:4000/api/...
   */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiInternalBase}/api/:path*`,
      },
    ];
  },

  // Baseline security headers (the API already applies helmet; the webapp adds
  // these response headers for hardened browser posture).
  async headers() {
    // React dev mode calls eval()/new Function() to reconstruct component
    // stack traces (recoverable warning otherwise). That is NOT needed in
    // production, so keep 'unsafe-eval' dev-only for a strict prod CSP.
    const isDev = process.env.NODE_ENV !== 'production';
    const scriptSrc = [
      "'self'",
      "'unsafe-inline'", // Next.js injects inline hydration/RSC scripts
      isDev ? "'unsafe-eval'" : '', // React dev-only stack reconstruction
      'https://js.stripe.com',
    ]
      .filter(Boolean)
      .join(' ');

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
              `script-src ${scriptSrc}`,
              // 'unsafe-inline' needed for Next.js + styled runtime inline styles.
              "style-src 'self' 'unsafe-inline'",
              "style-src-attr 'unsafe-inline'",
              // 'self' + media host(s) so product/store images load; data:/blob:
              // for optimized-image placeholders and Next.js blur upscaling.
              `img-src 'self' data: blob: ${mediaCspSources.join(' ')}`,
              "font-src 'self' data:",
              `connect-src 'self' ${apiOrigin} https://js.stripe.com https://api.stripe.com`,
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
