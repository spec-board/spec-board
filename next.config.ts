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
  turbopack: {},
};

export default nextConfig;
