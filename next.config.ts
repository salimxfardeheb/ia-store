import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  // Prevent Turbopack from bundling native Node.js packages
  serverExternalPackages: ["@prisma/adapter-libsql", "@libsql/client"],
};

export default nextConfig;