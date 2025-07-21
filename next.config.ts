import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['react-markdown', 'katex'],
  },

  // Headers for caching and compression
  async headers() {
    return [
      {
        source: '/:path*.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml',
          },
        ],
      },
      {
        source: '/:lang/knowledge/:slug*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400', // 1 hour cache, 24h stale
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/:lang/chat',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=1800', // 5 min cache, 30min stale
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/api/knowledge/:slug*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=3600', // 5 min cache, 1h stale
          },
        ],
      },
      {
        source: '/api/ask',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate', // No caching for chat API
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.infoneva.com' }],
        destination: 'https://infoneva.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
