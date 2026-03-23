import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  logging: {
    browserToTerminal: true,
  },
  // Force cache invalidation - v3 (2026-03-23T12:00)
  generateBuildId: async () => `build-v3-${Date.now()}`,
  // Disable persistent caching to ensure fresh builds
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;
