const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: false, // PWA ALWAYS ENABLED - for both development and production
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  workboxOptions: {
    disableDevLogs: process.env.NODE_ENV === "production",
    importScripts: ["/worker/sw-custom.js"], // Import our custom worker code
  },
  customWorkerDir: "worker",

  // Optimized for Turbopack compatibility
  buildExcludes: [/middleware-manifest\.json$/, /app-build-manifest\.json$/],
  fallbacks: {
    document: "/offline.html", // Optional: create an offline page
  },

  // Simplified caching strategies for better Turbopack compatibility
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
        networkTimeoutSeconds: 10,
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
    {
      urlPattern: /\.(?:js|css|woff|woff2|ttf|eot)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "static-resources",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for Turbopack
  experimental: {
    // Turbopack is enabled via CLI flag, not config
  },
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
