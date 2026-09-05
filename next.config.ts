// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Deshabilitar verificación de TypeScript durante el build
  typescript: {
    ignoreBuildErrors: true,
  },
  // Deshabilitar ESLint durante el build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Opcional: otras configuraciones
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig