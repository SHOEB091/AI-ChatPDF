import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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
      stream: require.resolve("stream-browserify"),
      crypto: require.resolve("crypto-browserify"),
      buffer: require.resolve("buffer"),
      url: require.resolve("url"),
    };
    
    return config;
  },
  // Disable strict mode temporarily for debugging
  reactStrictMode: false,
  serverExternalPackages: ["@pinecone-database/pinecone"]
};

export default nextConfig;
