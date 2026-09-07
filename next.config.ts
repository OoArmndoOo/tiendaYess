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
  // Configuración de imágenes (opcional)
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
  // Opcional: deshabilitar el middleware obsoleto (solo para limpiar la advertencia)
  // experimental: {
  //   turbopack: {
  //     // ... configuraciones
  //   }
  // }
}

export default nextConfig