// Match the origin used by resolveImageUrl, including its configured API port.
const apiOrigin = new URL(
  process.env.NEXT_PUBLIC_API_ORIGIN ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5050'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets a verification build run beside `next dev` without clobbering .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  poweredByHeader: false,
  compress: true,

  images: {
    // Cloudinary images are resized and format-converted by Cloudinary's CDN
    // (src/lib/imageLoader.ts); anything else falls back to the built-in
    // optimizer below.
    loader: 'custom',
    loaderFile: './src/lib/imageLoader.ts',
    // Widths offered in srcset: phones → full-HD → 2.5K. (Dropping the 3840
    // default avoids 4K downloads nobody can see the difference in.)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2560],
    // AVIF/WebP are 30–60% smaller than JPEG for product photography.
    formats: ['image/avif', 'image/webp'],
    // Optimised images are cached for 30 days (Cloudinary URLs are versioned,
    // so a changed image gets a new URL anyway).
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'example.com' },
      // Uploaded product/category images served by the API.
      {
        protocol: apiOrigin.protocol.slice(0, -1),
        hostname: apiOrigin.hostname,
        port: apiOrigin.port,
        pathname: '/uploads/**',
      },
      { protocol: 'http', hostname: 'localhost', port: '5050', pathname: '/uploads/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '5050', pathname: '/uploads/**' },
    ],
  },

  experimental: {
    // Import only the icons / helpers actually used instead of whole barrels.
    optimizePackageImports: ['lucide-react', 'framer-motion', '@tanstack/react-query'],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Camera: virtual try-on. Microphone: voice search. Geolocation: store locator.
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(self)' },
        ],
      },
      {
        // Files in /public (images, video, fonts). Not fingerprinted, so cache
        // for a day and revalidate in the background rather than forever.
        source: '/:file*\\.(jpg|jpeg|png|webp|avif|gif|svg|ico|mp4|webm|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
