import type { NextConfig } from "next";

/**
 * Sin `images.remotePatterns`: la demo no usa Drive, Google ni Cloudinary.
 * Todas las imagenes salen de /public o son data URL de lo que sube el
 * visitante, y esas van en <img>, no en next/image.
 */
const nextConfig: NextConfig = {
  reactStrictMode: false,
  turbopack: {},
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@components': './src/components',
      '@app': './src/app',
    };
    return config;
  },
};

export default nextConfig;
