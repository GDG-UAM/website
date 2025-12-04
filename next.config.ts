import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  output: "standalone",
  compiler: {
    styledComponents: true
  },
  webpack: (config) => {
    config.cache = false;
    return config;
  },
  images: {
    // Allow images from any remote source
    // Security is handled by sanitizing markdown content
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      },
      {
        protocol: "http",
        hostname: "**"
      }
    ]
  },
  experimental: {
    turbopackFileSystemCacheForDev: true
  }
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
export default withNextIntl(nextConfig);
