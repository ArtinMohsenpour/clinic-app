import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // نادیده گرفتن خطاهای ESLint در هنگام بیلد
    ignoreDuringBuilds: true,
  },
  typescript: {
    // نادیده گرفتن خطاهای تایپ‌اسکریپت در هنگام بیلد
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
};

export default nextConfig;