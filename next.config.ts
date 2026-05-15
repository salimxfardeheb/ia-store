import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  // Prevent Turbopack from bundling native Node.js packages
  serverExternalPackages: ["@prisma/adapter-libsql", "@libsql/client"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;