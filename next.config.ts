const withPWA = require('next-pwa');

const headers = [
  {
    source: '/:path*',
    headers: [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
      },
      {
        key: 'X-Frame-Options',
        value: 'DENY'
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin'
      },
      {
        key: 'Permissions-Policy',
        value: [
          'accelerometer=()',
          'camera=()',
          'geolocation=()',
          'gyroscope=()',
          'magnetometer=()',
          'microphone=()',
          'payment=()',
          'usb=()',
          'interest-cohort=()',
          'sync-xhr=()',
          'autoplay=()',
          'fullscreen=(self)',
          'picture-in-picture=()'
        ].join(', ')
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self';",
          "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' 'unsafe-eval' chrome-extension:;",
          "style-src 'self' 'unsafe-inline' 'unsafe-eval';",
          "img-src 'self' https://i.imgur.com data:;",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co;",
          "frame-src 'self';",
          "worker-src 'self' blob:;",
          "base-uri 'self';",
          "form-action 'self';",
          "object-src 'none';",
          "frame-ancestors 'none';",
          "block-all-mixed-content;",
          "upgrade-insecure-requests;"
        ].join(' ')
      }
    ]
  }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.imgur.com']
  },
  async headers() {
    return headers;
  }
};

const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-api-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    {
      urlPattern: /^https:\/\/i\.imgur\.com\/.*/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'imgur-image-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    }
  ]
};

module.exports = withPWA(pwaConfig)(nextConfig);
