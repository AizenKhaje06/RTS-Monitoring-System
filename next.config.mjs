/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        child_process: false,
        http2: false,
        tls: false,
        'node:buffer': false,
        'node:fs': false,
        'node:https': false,
        'node:http': false,
      };
    }
    return config;
  },
}

export default nextConfig
