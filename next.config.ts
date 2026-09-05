// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ¡AÑADE ESTA LÍNEA!
  allowedDevOrigins: ['192.168.1.19'], // <--- Tu IP local
  // ... el resto de tu configuración (si tienes)
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