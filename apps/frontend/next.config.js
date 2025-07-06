/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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

module.exports = nextConfig 