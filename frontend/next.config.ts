import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Konfigurasi untuk mengatasi masalah RSC
  serverExternalPackages: [],
  
  // Experimental features untuk stabilitas RSC
  experimental: {
    // Optimasi untuk development
    optimizePackageImports: ['lucide-react'],
  },
  
  // Konfigurasi TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Headers untuk mengatasi masalah CORS dan RSC
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
