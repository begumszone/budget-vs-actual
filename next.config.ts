import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  experimental: {
    // Allow larger request bodies for file uploads (invoice PDFs / receipt photos)
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
