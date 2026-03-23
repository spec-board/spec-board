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
  // Force cache invalidation - v2
  generateBuildId: async () => `build-${Date.now()}`,
};

export default nextConfig;
