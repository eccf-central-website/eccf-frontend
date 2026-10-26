/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.ytimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'd3t3ozftmdmh3i.cloudfront.net',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/dashboard/login',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/dashboard/executives',
        destination: '/dashboard/workers',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
