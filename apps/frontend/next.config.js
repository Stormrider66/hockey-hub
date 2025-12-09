const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: process.env.BUNDLE_ANALYZE !== 'browser' && process.env.BUNDLE_ANALYZE !== 'server',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimize production builds
  productionBrowserSourceMaps: false,
  // outputFileTracing is removed as it's causing issues
  // Compiler options for optimization
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
    // Enable React optimization
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  // Experimental features for better optimization
  experimental: {
    // Enable optimizeCss for smaller CSS bundles
    optimizeCss: true,
    // Enable module optimization
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'lodash-es',
      '@mui/material',
      '@mui/icons-material',
      'recharts',
      'react-icons',
    ],
  },
  // Webpack configuration for tree shaking
  webpack: (config, { dev, isServer }) => {
    // Handle Node.js modules for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        dns: false,
      };
    }
    
    // Enable tree shaking in production
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        // Enable module concatenation for better tree shaking
        concatenateModules: true,
        // Minimize bundle size
        minimize: true,
        // Split chunks for better caching
        splitChunks: {
          chunks: 'all',
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          minSize: 20000,
          maxSize: 244000,
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20
            },
            // Common chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            },
            // Separate chunks for large libraries
            lodash: {
              test: /[\\/]node_modules[\\/]lodash/,
              name: 'lodash',
              priority: 30,
              chunks: 'all',
              reuseExistingChunk: true
            },
            mui: {
              test: /[\\/]node_modules[\\/]@mui/,
              name: 'mui',
              priority: 30,
              chunks: 'all',
              reuseExistingChunk: true
            },
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui/,
              name: 'radix',
              priority: 30,
              chunks: 'all',
              reuseExistingChunk: true
            },
            icons: {
              test: /[\\/]node_modules[\\/](lucide-react|react-icons|@radix-ui\/react-icons)/,
              name: 'icons',
              priority: 30,
              chunks: 'all',
              reuseExistingChunk: true
            },
            charts: {
              test: /[\\/]node_modules[\\/](recharts|chart\.js|d3)/,
              name: 'charts',
              priority: 30,
              chunks: 'all',
              reuseExistingChunk: true
            },
            // Additional vendor chunks for better caching
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)/,
              name: 'react',
              priority: 40,
              chunks: 'all',
              reuseExistingChunk: true
            },
            redux: {
              test: /[\\/]node_modules[\\/](@reduxjs|redux|react-redux)/,
              name: 'redux',
              priority: 30,
              chunks: 'all',
              reuseExistingChunk: true
            },
            i18n: {
              test: /[\\/]node_modules[\\/](i18next|react-i18next)/,
              name: 'i18n',
              priority: 30,
              chunks: 'all',
              reuseExistingChunk: true
            },
            forms: {
              test: /[\\/]node_modules[\\/](react-hook-form|@hookform)/,
              name: 'forms',
              priority: 30,
              chunks: 'all',
              reuseExistingChunk: true
            },
            dnd: {
              test: /[\\/]node_modules[\\/](@dnd-kit|react-beautiful-dnd)/,
              name: 'dnd',
              priority: 30,
              chunks: 'all',
              reuseExistingChunk: true
            },
            dates: {
              test: /[\\/]node_modules[\\/](date-fns|dayjs|moment)/,
              name: 'dates',
              priority: 30,
              chunks: 'all',
              reuseExistingChunk: true
            },
            utils: {
              test: /[\\/]node_modules[\\/](clsx|classnames|uuid|nanoid)/,
              name: 'utils',
              priority: 25,
              chunks: 'all',
              reuseExistingChunk: true
            }
          }
        }
      };

      // Add webpack plugins for better optimization
      const TerserPlugin = require('terser-webpack-plugin');
      config.optimization.minimizer = [
        new TerserPlugin({
          terserOptions: {
            parse: {
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
              drop_console: true,
              drop_debugger: true,
              pure_funcs: ['console.log', 'console.info'],
            },
            mangle: {
              safari10: true,
            },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
        }),
      ];
    }

    // Add aliases for optimized imports
    config.resolve.alias = {
      ...config.resolve.alias,
      'lodash': 'lodash-es',
    };

    // Add module resolution for better tree shaking
    config.resolve.mainFields = ['module', 'main'];

    return config;
  },
  // Image optimization configuration
  images: {
    // Enable modern image formats
    formats: ['image/avif', 'image/webp'],
    // Define allowed image domains for external images
    domains: [
      'localhost',
      // Add your production domains here
    ],
    // Remote patterns for more flexible matching
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.hockeyhub.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
    ],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // Image sizes for different breakpoints
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimum cache time in seconds
    minimumCacheTTL: 60,
    // Disable static imports for flexibility
    disableStaticImages: false,
  },
  // eslint: {
  //   // Warning: This allows production builds to successfully complete even if
  //   // your project has ESLint errors.
  //   ignoreDuringBuilds: true,
  // },
  // typescript: {
  //   // Warning: This allows production builds to successfully complete even if
  //   // your project has type errors.
  //   ignoreBuildErrors: true,
  // },
  async rewrites() {
    const gateway = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${gateway}/api/v1/:path*`,
      },
    ];
  },
}

module.exports = withBundleAnalyzer(nextConfig) 