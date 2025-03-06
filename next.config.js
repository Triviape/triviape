/** @type {import('next').NextConfig} */
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
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true, // Always ignore build errors for now
  },
};

module.exports = nextConfig; 