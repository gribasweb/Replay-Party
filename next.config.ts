import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Placeholder photography while the real event photos are not provided.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    qualities: [60, 75, 90],
  },
};

export default nextConfig;
