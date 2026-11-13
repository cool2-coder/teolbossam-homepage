/** @type {import('next').NextConfig} */
const nextConfig = {
  env: { COMMIT_REF: process.env.COMMIT_REF ?? "" },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
      {
        source: "/(j|p|admin)/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
};
export default nextConfig;
