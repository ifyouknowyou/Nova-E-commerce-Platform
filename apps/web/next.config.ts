import type { NextConfig } from 'next';

const apiInternalBase = (process.env.API_INTERNAL_URL ?? 'http://localhost:4000').replace(/\/api\/?$/, '');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiInternalBase}/api/:path*`,
      },
    ];
  },
  // Baseline security headers for the standalone storefront.
  async headers() {
    // React dev mode calls eval()/new Function() to reconstruct component
    // stack traces (recoverable warning otherwise). That is NOT needed in
    // production, so keep 'unsafe-eval' dev-only for a strict prod CSP.
    const isDev = process.env.NODE_ENV !== 'production';
    const scriptSrc = [
      "'self'",
      "'unsafe-inline'", // Next.js injects inline hydration/RSC scripts
      isDev ? "'unsafe-eval'" : '', // React dev-only stack reconstruction
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
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-src 'none'",
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
