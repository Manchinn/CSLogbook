import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly set workspace root to silence multi-lockfile warning
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
