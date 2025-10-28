import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: process.cwd(),
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Handle Node.js built-in modules for client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        child_process: false,
        http2: false,
        tls: false,
        buffer: false,
        'node:buffer': false,
        'node:fs': false,
        'node:https': false,
        'node:http': false,
        'node:net': false,
      };
    }

    return config;
  },
}

export default nextConfig
