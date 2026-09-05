// components/ui/DashboardHeader.tsx
'use client'

import { Search, Bell, Menu } from 'lucide-react'
import { SessionUser } from '@/types'
import { usePathname } from 'next/navigation'

interface DashboardHeaderProps {
  usuario: SessionUser
  onMenuClick?: () => void
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
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Botón menú hamburguesa (visible solo en móvil) */}
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

        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Buscar productos..."
              className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  )
}