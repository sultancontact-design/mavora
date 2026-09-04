import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  
  // ============================================================
  // TypeScript Configuration
  // ============================================================
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ============================================================
  // React Configuration
  // ============================================================
  reactStrictMode: false,
  
  // ============================================================
  // Image Optimization
  // ============================================================
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pexels.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],
    // Image formats to use (in order of preference)
    formats: ['image/avif', 'image/webp'],
    // Enable image optimization
    unoptimized: false,
    // Minimum cache time in seconds (1 year for immutable images)
    minimumCacheTTL: 60 * 60 * 24 * 365,
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Image sizes to generate
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // ============================================================
  // Experimental Features for Performance
  // ============================================================
  experimental: {
    // Enable React Compiler (automatic memoization)
    // reactCompiler: true,
    
    // Optimize package imports for smaller bundles
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'lodash',
      'recharts',
    ],
    
    // Enable server actions (if needed)
    serverActions: {
      bodySizeLimit: '2mb',
    },
    
    // Enable CSS code splitting for better caching
    cssChunking: true,
  },

  // ============================================================
  // Headers Configuration (Caching & Security)
  // ============================================================
  async headers() {
    return [
      {
        source: '/(.*)',
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
        // Cache static assets aggressively
        source: '/(.*)\\.(ico|png|jpg|jpeg|gif|webp|avif|svg|woff2?)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache JS/CSS files with content hashes
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Don't cache HTML pages (they're dynamic)
        source: '/(?!_next/static)(.*)\\.html',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, must-revalidate',
          },
        ],
      },
      {
        // API routes - short cache or no cache
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },

  // ============================================================
  // Redirects Configuration
  // ============================================================
  async redirects() {
    return [];
  },

  // ============================================================
  // Webpack Configuration (Advanced)
  // ============================================================
  webpack: (config, { isServer }) => {
    // Split vendor chunks for better caching
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              reuseExistingChunk: true,
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
              chunks: 'all',
            },
            ui: {
              test: /[\\/]components[\\/]ui[\\/]/,
              name: 'ui-chunks',
              priority: 15,
              reuseExistingChunk: true,
              chunks: 'all',
            },
          },
        },
      };
    }

    // Support for importing .wasm files if needed
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };

    return config;
  },
};

export default nextConfig;
