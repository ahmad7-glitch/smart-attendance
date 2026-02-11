/** @type {import('next').NextConfig} */
const nextConfig = {
  // Reduce serverless function size
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  // Headers for caching static assets
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  // Compress responses
  compress: true,
  // Reduce bundle by disabling source maps in production
  productionBrowserSourceMaps: false,
  // Power header not needed
  poweredByHeader: false,
};

export default nextConfig;
