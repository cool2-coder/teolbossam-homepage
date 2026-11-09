/** @type {import('next').NextConfig} */
const nextConfig = {
  env: { COMMIT_REF: process.env.COMMIT_REF ?? "" },
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
  },
};
export default nextConfig;
