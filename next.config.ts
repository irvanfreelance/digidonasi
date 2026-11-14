import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  compress: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  serverExternalPackages: ["pdfkit"],
  async headers() {
    return [
      {
        source: "/api/payment-methods",
        headers: [
          { key: "Cache-Control", value: "s-maxage=300, stale-while-revalidate=60" },
        ],
      },
      {
        source: "/api/campaigns/:slug",
        headers: [
          { key: "Cache-Control", value: "s-maxage=60, stale-while-revalidate=30" },
        ],
      },
    ];
  },
};

export default nextConfig;
