const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: false, // Enable PWA for testing
  customWorkerDir: "worker",
  // More conservative PWA settings to reduce file watching issues
  buildExcludes: [/middleware-manifest\.json$/],
  reloadOnOnline: false,

  // Simpler caching strategies to reduce file system events
  runtimeCaching: [
    {
      urlPattern: /^https?:\/\/.*\/api\//,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow TypeScript errors during build for faster iteration
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["localhost"],
    formats: ["image/webp", "image/avif"],
  },
  // PWA and security headers
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "origin-when-cross-origin",
        },
      ],
    },
    {
      source: "/sw.js",
      headers: [
        {
          key: "Content-Type",
          value: "application/javascript; charset=utf-8",
        },
        {
          key: "Cache-Control",
          value: "no-cache, no-store, must-revalidate",
        },
      ],
    },
  ],
};

module.exports = withPWA(nextConfig);
