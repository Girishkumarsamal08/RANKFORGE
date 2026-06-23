/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* We can specify rewrites to proxy requests to Express during local run */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
