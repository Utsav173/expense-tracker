import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        hostname: 'i.stack.imgur.com'
      }
    ]
  },
  // Add MDX extensions to the list of page extensions
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  experimental: {
    mdxRs: true
  }
};

const withMDX = createMDX({
  options: {
    // Pass plugin names as strings for Turbopack compatibility
    remarkPlugins: ['remark-gfm'],
    rehypePlugins: []
  }
});

export default withMDX(nextConfig);
