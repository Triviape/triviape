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
  swcMinify: true,
  experimental: {
    optimizeCss: true,
    turbo: {
      rules: {
        // Include all files in the app directory
        '**/*': ['static']
      }
    }
  },
  // Disable server components for specific paths (if needed)
  serverComponentsExternalPackages: [
    'firebase-admin'
  ],
};

export default nextConfig;
