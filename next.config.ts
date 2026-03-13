import type { NextConfig } from "next";

// Cache buster: Force rebuild after removing React Compiler
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
