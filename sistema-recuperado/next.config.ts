import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*"],
  // Configure Turbopack for Next.js 16
  turbopack: {
    // Set the correct absolute root directory
    root: path.resolve(__dirname),
  },
  // Disable source maps in development to avoid console errors
  productionBrowserSourceMaps: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
