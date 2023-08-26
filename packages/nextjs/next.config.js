// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  eslint: {
    ignoreDuringBuilds: true,// process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  transpilePackages: ['@lens-protocol'],
};

module.exports = nextConfig;
