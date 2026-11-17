// Match the origin used by resolveImageUrl, including its configured API port.
const apiOrigin = new URL(
  process.env.NEXT_PUBLIC_API_ORIGIN ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5050'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
};

module.exports = nextConfig;
