/**
 * BiteMap web — Next.js config with Phase 13 security headers + Sentry.
 */
import { withSentryConfig } from '@sentry/nextjs';

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "img-src 'self' data: blob: https://*.supabase.co https://*.mapbox.com",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "font-src 'self' data:",
  [
    'connect-src',
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'https://api.mapbox.com',
    'https://events.mapbox.com',
    'https://marine-api.open-meteo.com',
    'https://api.open-meteo.com',
    'https://*.sentry.io',
  ].join(' '),
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: CSP_DIRECTIVES },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self), camera=(), microphone=()',
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  hideSourceMaps: true,
  tunnelRoute: '/monitoring',
});
