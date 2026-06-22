import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import withPWA from "next-pwa";
import runtimeCaching from "next-pwa/cache";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@likaslens/shared"],
  turbopack: {},
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
  ],
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
