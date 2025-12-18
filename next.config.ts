import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // Fix for Windows/iCloud Drive symlink issues
  outputFileTracingRoot: process.cwd(),
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: [
      'react-markdown', 
      'katex', 
      '@supabase/ssr', 
      '@supabase/supabase-js',
      'framer-motion',
      'lucide-react',
      'react-icons',
    ],
    // TurboPack Cache-Optimierungen (nur wenn TurboPack verwendet wird)
    turbo: {
      // Limit cache size to prevent disk space issues
      memoryLimit: 512, // 512MB memory limit for TurboPack (reduced from 1GB)
    },
    // Reduce memory usage
    serverActions: {
      bodySizeLimit: '2mb', // Limit request body size
    },
  },

  // Memory optimization for Dev Server
  // Reduce memory usage during development
  onDemandEntries: {
    // Period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 10 * 1000, // 10 seconds (aggressively reduced to save memory)
    // Number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 1, // Reduced to 1 (minimum)
  },

  // Suppress Next.js warnings in console
  logging: {
    fetches: {
      fullUrl: false, // Don't log full URLs to reduce console noise
    },
  },

  // 🔥 CRITICAL: Reduce file watcher load to prevent PC freezing during file operations
  webpack: (config, { isServer, webpack }) => {
    // Suppress Supabase Realtime warnings (they're harmless)
    // Next.js 15 - use comprehensive suppression with function-based filtering
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase\/realtime-js/ },
      { message: /Critical dependency: the request of a dependency is an expression/ },
      /Critical dependency: the request of a dependency is an expression/,
      /node_modules\/@supabase\/realtime-js/,
      (warning: any) => {
        const message = warning.message || warning.toString() || '';
        const module = warning.module?.resource || warning.module?.identifier || '';
        return message.includes('Critical dependency') || module.includes('@supabase/realtime-js');
      },
    ];

    // Suppress warnings at the module level
    config.module = config.module || {};
    config.module.exprContextCritical = false; // Suppress critical dependency warnings
    config.module.unknownContextCritical = false;

    // Suppress via infrastructureLogging for Next.js 15
    if (!config.infrastructureLogging) {
      config.infrastructureLogging = {};
    }
    config.infrastructureLogging.level = 'error'; // Only show errors, not warnings
    
    // Also suppress warnings via stats configuration
    if (!config.stats) {
      config.stats = {};
    }
    config.stats.warnings = false; // Disable warning output

    // Also suppress via onWarn for Next.js 15
    const originalOnWarn = config.onWarn;
    config.onWarn = (warning, warn) => {
      // Suppress Supabase Realtime warnings
      const warningMessage = warning.message || warning.toString() || '';
      const warningModule = warning.module?.resource || warning.module?.identifier || '';
      
      if (
        warningMessage.includes('Critical dependency') ||
        warningMessage.includes('@supabase/realtime-js') ||
        warningModule.includes('@supabase/realtime-js') ||
        warningModule.includes('realtime-js')
      ) {
        return; // Suppress this warning completely
      }
      // Call original handler if it exists
      if (originalOnWarn) {
        originalOnWarn(warning, warn);
      } else if (warn) {
        warn(warning);
      }
    };

    if (!isServer) {
      // Client-side webpack config
      config.watchOptions = {
        ignored: [
          '**/.git/**',
          '**/node_modules/**',
          '**/.next/**',
          '**/firebase/**',
          '**/public/generated/**', // CRITICAL: Ignore generated/split files
          '**/public/**/*.jsonl', // Ignore all JSONL files
          '**/knowledge/**', // Ignore knowledge pages during generation
          '**/supabase_migrations/**',
          '**/scripts/**',
          '**/*.tsbuildinfo',
        ],
        aggregateTimeout: 1000, // Delay rebuild after first change
        poll: false, // Disable polling (use native events)
      };
    }
    return config;
  },

  // Headers for caching and compression
  async headers() {
    return [
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/sitemap-:path*.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/cars',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=600, stale-while-revalidate=3600',
          },
        ],
      },
      {
        source: '/cars/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=600, stale-while-revalidate=3600',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
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
        has: [{ type: 'host', value: 'www.fahrzeugfehler.de' }],
        destination: 'https://fahrzeugfehler.de/:path*',
        permanent: true,
      },
      // Alte Domain-Redirects (falls nötig)
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.faultbase.com' }],
        destination: 'https://fahrzeugfehler.de/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
