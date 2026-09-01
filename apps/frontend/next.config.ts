import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withPWA from "next-pwa";
import runtimeCaching from "next-pwa/cache";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  transpilePackages: ["@likaslens/shared"],
  turbopack: {},
  redirects: async () => [
    {
      source: "/scoreboard",
      destination: "/public-record",
      permanent: false,
    },
    {
      source: "/:locale/scoreboard",
      destination: "/:locale/public-record",
      permanent: false,
    },
  ],
  images: {
    qualities: [70, 75, 85],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        {
          key: "Permissions-Policy",
          value: "camera=(self), microphone=(self), geolocation=(self)",
        },
      ],
    },
    {
      // Cache ONNX models aggressively (immutable, content-addressed)
      source: "/models/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        { key: "Content-Type", value: "application/octet-stream" },
      ],
    },
    {
      // Cache static images with stale-while-revalidate
      source: "/images/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
      ],
    },
    {
      // Cache PWA icons immutably
      source: "/icons/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ],
  webpack: (config, { isServer }) => {
    // Handle WASM files for ONNX Runtime Web (client-only)
    if (!isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };
    }
    // Don't bundle Node-only modules in the browser bundle
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
};

const isProduction = process.env.NODE_ENV === "production";

const pwaConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  runtimeCaching,
  disable: !isProduction,
});

export default withNextIntl(pwaConfig(nextConfig));
