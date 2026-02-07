import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    imageSizes: [24, 32, 40, 48, 64, 96, 128],
    minimumCacheTTL: 60 * 60 * 24,
  },
  reactStrictMode: true,
  // swcMinify: true, // Removed as it's enabled by default in Next.js 15
  experimental: {
    optimizeCss: true,
    turbo: {
      rules: {
        // Include all files in the app directory
        '**/*': ['static']
      }
    }
  },
  // Renamed from serverComponentsExternalPackages to serverExternalPackages
  serverExternalPackages: [
    'firebase-admin'
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        child_process: false,
      };
    }
    return config;
  },
};

const withBundleAnalyzer =
  process.env.ANALYZE === 'true'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@next/bundle-analyzer')({ enabled: true })
    : (config: NextConfig) => config;

export default withBundleAnalyzer(nextConfig);
