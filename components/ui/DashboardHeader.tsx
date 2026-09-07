// components/ui/DashboardHeader.tsx
'use client'

import { Menu, Home } from 'lucide-react'
import Link from 'next/link'
import { SessionUser } from '@/types'
import { usePathname } from 'next/navigation'

interface DashboardHeaderProps {
  usuario: SessionUser
  onMenuClick: () => void
}

export default function DashboardHeader({ usuario, onMenuClick }: DashboardHeaderProps) {
  const pathname = usePathname()

  const getPageTitle = () => {
    const routes: Record<string, string> = {
      '/dashboard': 'Panel de Control',
      '/dashboard/perfil': 'Mi Perfil',
      '/dashboard/crear-tipo': 'Crear Tipo',
      '/dashboard/crear-producto': 'Crear Producto',
      '/dashboard/inventario': 'Inventario',
      '/dashboard/registros': 'Registros',
      '/dashboard/usuarios': 'Usuarios',
    }
    return routes[pathname] || 'Dashboard'
  }

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Botón hamburguesa - visible solo en móvil */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">{getPageTitle()}</h1>
          <p className="text-sm text-gray-500 hidden md:block">Bienvenido, {usuario.nombre_usuario}</p>
        </div>
      </div>

      {/* Botón para volver a la página principal */}
      <Link
        href="/"
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
        title="Volver a la tienda"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Tienda</span>
      </Link>
    </header>
  )
}