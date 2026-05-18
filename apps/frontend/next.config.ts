import type { NextConfig } from "next";
import withPWA from "next-pwa";
import runtimeCaching from "next-pwa/cache";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  webpack: (config, { isServer }) => {
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

export default pwaConfig(nextConfig);
