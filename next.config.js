/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Firebase App Hosting configuration
  output: 'standalone',
  // Skip build errors for now - Firebase will handle them
  skipTrailingSlashRedirect: true,
}

module.exports = nextConfig
