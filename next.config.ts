import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Standalone output dla Docker — minimalny rozmiar obrazu
  output: 'standalone',
  // Wymuszenie transpilacji Three.js dla kompatybilności z App Router
  transpilePackages: ['three'],
}

export default nextConfig
