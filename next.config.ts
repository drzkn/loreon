import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimizaciones de build
  poweredByHeader: false,
  generateEtags: false,
  compress: true,

  // Optimizaciones de cache
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },

  // Configuración experimental para optimizar builds
  experimental: {
    // Optimizar carga de páginas
    optimizePackageImports: ['@ai-sdk/react', '@ai-sdk/google', 'ai'],

    // Mejoras de performance
    optimisticClientCache: true,
  },

  // Configuración de imágenes para cache
  images: {
    domains: [],
    unoptimized: false,
    formats: ['image/webp', 'image/avif'],
  },

  // Headers de cache
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=1, stale-while-revalidate=59'
          }
        ],
      }
    ];
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimizaciones de cache para webpack
    config.cache = {
      type: 'filesystem',
      allowCollectingMemory: true,
      buildDependencies: {
        config: [__filename],
      },
    };

    // Optimizar splits de chunks
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
          ai: {
            test: /[\\/]node_modules[\\/](@ai-sdk|ai)[\\/]/,
            name: 'ai-sdk',
            priority: 10,
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;
