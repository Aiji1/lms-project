import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Konfigurasi untuk mengatasi masalah RSC
  serverExternalPackages: [],
  
  // Experimental features untuk stabilitas RSC
  experimental: {
    // Optimasi untuk development
    optimizePackageImports: ['lucide-react'],
  },
  
  // Ignore TypeScript and ESLint errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Headers keamanan
  async headers() {
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/(.*)',
          headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
          ],
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
