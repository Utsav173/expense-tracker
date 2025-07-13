import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb'
    }
  },
  images: {
    remotePatterns: [
      {
        hostname: 'i.stack.imgur.com'
      }
    ]
  }
};

export default nextConfig;
