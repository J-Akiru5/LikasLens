import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withPWAInit from "@ducanh2912/next-pwa";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  // Custom SW handles all PWA behavior (offline queue, caching, background sync).
  // disable: true ensures next-pwa doesn't overwrite public/sw.js.
  disable: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  headers: async () => [
    {
      // Cache ONNX models aggressively for offline use
      source: "/models/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        { key: "Content-Type", value: "application/octet-stream" },
      ],
    },
  ],
  webpack: (config, { isServer }) => {
    // Handle WASM files for ONNX Runtime Web
    if (!isServer) {
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };
      config.module.rules.push({
        test: /\.wasm$/,
        type: "asset/resource",
      });
    }
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
  async rewrites() {
    // NOTE: do NOT disable this in production. The shared API client
    // (apps/shared/src/api/client.ts) posts to the relative "/api/..." path
    // on the client, which only resolves if this rewrite forwards it to the
    // Laravel backend. Without it, report submission (and every other
    // /api/* call) 404s in the deployed app.
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

// @ts-expect-error — @ducanh2912/next-pwa return type doesn't match Next.js 16 NextConfig
export default withNextIntl(withPWA(nextConfig));
