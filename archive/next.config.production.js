/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    // Enable Server Components
    serverComponentsExternalPackages: ["@supabase/supabase-js"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Security headers
  async headers() {
    return [
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
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
    ];
  },
  // Environment variables validation
  env: {
    NODE_ENV: process.env.NODE_ENV || "production",
  },
  // Disable source maps in production for security
  productionBrowserSourceMaps: false,
  // Enable compression
  compress: true,
  // Optimize for better performance
  poweredByHeader: false,
  // Enable SWC minification
  swcMinify: true,
  // Bundle analyzer (optional)
  ...(process.env.ANALYZE === "true" && {
    webpack: (config) => {
      config.plugins.push(new (require("@next/bundle-analyzer"))());
      return config;
    },
  }),
};

module.exports = nextConfig;
