import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production optimizations
  productionBrowserSourceMaps: false,
  compress: true,
  swcMinify: true,

  // Image optimization
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.instagram.com" },
      { protocol: "https", hostname: "instagram.com" },
    ],
    minimumCacheTTL: 31536000, // 1 year
    formats: ["image/webp", "image/avif"],
  },

  // Performance monitoring
  onDemandEntries: {
    maxInactiveAge: 15 * 60 * 1000,
    pagesBufferLength: 5,
  },

  // Experimental optimizations
  experimental: {
    // Optimize for faster builds when applicable
    isrMemoryCacheSize: 52 * 1024 * 1024, // 52 MB ISR cache
  },
};

export default nextConfig;
