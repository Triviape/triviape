import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
