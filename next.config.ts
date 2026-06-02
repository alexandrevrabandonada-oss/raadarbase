import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  productionBrowserSourceMaps: false,
  compress: true,

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.instagram.com" },
      { protocol: "https", hostname: "instagram.com" },
    ],
    minimumCacheTTL: 31536000, // 1 year
    formats: ["image/webp", "image/avif"],
  },

  // Dev page buffer
  onDemandEntries: {
    maxInactiveAge: 15 * 60 * 1000,
    pagesBufferLength: 5,
  },
};

export default nextConfig;
