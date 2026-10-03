/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lets verification build safely while the local dev server is running.
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Product, category and banner images are served from Cloudinary.
    // picsum.photos is only for the backend's seed data (local testing).
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
