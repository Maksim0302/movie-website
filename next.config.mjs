/** @type {import('next').NextConfig} */

const nextConfig = {
  /* config options here */

  reactCompiler: true,
  allowedDevOrigins: ['192.168.3.28'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
    ],
  },
}

export default nextConfig
