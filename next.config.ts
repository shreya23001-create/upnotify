import type { NextConfig } from "next";

// Domains used by analytics/third-party scripts
const GTM   = 'https://www.googletagmanager.com';
const GA    = 'https://www.google-analytics.com https://ssl.google-analytics.com https://analytics.google.com';
const CLARITY   = 'https://www.clarity.ms https://scripts.clarity.ms https://r.clarity.ms https://c.bing.com';
const STRIPE    = 'https://js.stripe.com https://checkout.stripe.com';
const RAZORPAY  = 'https://checkout.razorpay.com https://cdn.razorpay.com https://api.razorpay.com';
const SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

const csp = [
  `default-src 'self'`,
  // Scripts: self + inline (theme toggle, GTM bootstrap) + eval (GTM custom JS tags) + CDN origins
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${GTM} ${GA} ${CLARITY} ${STRIPE} ${RAZORPAY}`,
  // Styles: self + inline (CSS-in-JS / Next.js injected styles)
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  // Fonts
  `font-src 'self' https://fonts.gstatic.com data:`,
  // Images: self + data URIs + any HTTPS (avatars, OG images, etc.)
  `img-src 'self' data: blob: https:`,
  // XHR/fetch/WebSocket: self + Supabase + Stripe + analytics
  `connect-src 'self' ${SUPABASE} https://api.stripe.com ${RAZORPAY} ${GTM} ${GA} ${CLARITY} wss:`,
  // Frames: Stripe + Razorpay Checkout
  `frame-src 'self' ${STRIPE} ${RAZORPAY} ${GTM}`,
  `object-src 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
].join('; ');

// Hard SEO rule: only production (master deploy) is indexable. Every other
// Vercel env — preview, dev — must serve noindex,nofollow at both the meta
// layer (app/layout.tsx) and the HTTP layer (X-Robots-Tag). The header
// guarantees coverage for redirects, image responses, JSON endpoints, and
// any path the meta tag never reaches.
const IS_PRODUCTION_HOST = process.env.VERCEL_ENV === 'production';
const NON_PROD_NOINDEX_HEADERS: { key: string; value: string }[] = IS_PRODUCTION_HOST
  ? []
  : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];

const nextConfig: NextConfig = {
  headers: async (): Promise<
    { source: string; headers: { key: string; value: string }[] }[]
  > => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options',    value: 'nosniff' },
        { key: 'X-Frame-Options',           value: 'DENY' },
        { key: 'X-XSS-Protection',          value: '1; mode=block' },
        { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy',        value: 'geolocation=(), microphone=(), camera=(), accelerometer=*, gyroscope=*' },
        { key: 'Content-Security-Policy',   value: csp },
        ...NON_PROD_NOINDEX_HEADERS,
      ],
    },
  ],
};

export default nextConfig;
