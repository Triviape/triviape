/** @type {import('next').NextConfig} */
const withBundleAnalyzer = process.env.ANALYZE === 'true' 
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config) => config;

const nextConfig = {
  /* config options here */
  images: {
    domains: ['firebasestorage.googleapis.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '**',
      },
    ],
  },
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
    turbo: {
      rules: {
        // Include all files in the app directory
        '**/*': ['static']
      }
    },
    // Enable memory cache for faster builds
    memoryBasedWorkersCount: true,
    // Optimize bundle size
    optimizePackageImports: ['react', 'react-dom', 'lucide-react', '@radix-ui/react-*'],
  },
  // Renamed from serverComponentsExternalPackages to serverExternalPackages
  serverExternalPackages: [
    'firebase-admin'
  ],
  // Add compiler options for faster builds
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Increase build performance
  poweredByHeader: false,
  compress: true,
  // Temporarily disable ESLint during build
};

module.exports = withBundleAnalyzer(nextConfig); 