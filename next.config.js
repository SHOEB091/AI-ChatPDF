// This file is used to modify Next.js webpack configuration
// https://nextjs.org/docs/api-reference/next.config.js/introduction

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Ignoring TypeScript errors during build
    // Only do this in development when debugging or on Vercel
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! WARN !!
    // Ignoring ESLint errors during build
    // Only do this in development when debugging or on Vercel
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    // Resolve Node.js modules for compatibility
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
      http: false,
      https: false,
    };
    
    return config;
  },
  // Disable strict mode temporarily for debugging
  reactStrictMode: false,
  serverExternalPackages: ["@pinecone-database/pinecone"]
};

module.exports = nextConfig;
