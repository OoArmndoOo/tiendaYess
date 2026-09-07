// components/ui/Sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Package, 
  PlusCircle, 
  Tag, 
  Users, 
  ClipboardList, 
  UserCog,
  LogOut,
  X,
  Store // ← NUEVO: icono de tienda
} from 'lucide-react'
import { logoutUsuarioAction } from '@/lib/actions/auth'
import { useRouter } from 'next/navigation'
import { SessionUser } from '@/types'
import { useEffect } from 'react'

interface SidebarProps {
  usuario: SessionUser
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ usuario, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', adminOnly: false },
    { icon: Package, label: 'Inventario', href: '/dashboard/inventario', adminOnly: false },
    { icon: PlusCircle, label: 'Crear Producto', href: '/dashboard/crear-producto', adminOnly: false },
    { icon: Tag, label: 'Crear Tipo', href: '/dashboard/crear-tipo', adminOnly: false },
    { icon: Users, label: 'Usuarios', href: '/dashboard/usuarios', adminOnly: true },
    { icon: ClipboardList, label: 'Registros', href: '/dashboard/registros', adminOnly: true },
    { icon: UserCog, label: 'Perfil', href: '/dashboard/perfil', adminOnly: false },
    // ====== NUEVO: SEPARADOR Y BOTÓN DE TIENDA ======
    { icon: Store, label: 'Ver Tienda', href: '/', adminOnly: false, isExternal: true },
  ]

  const filteredItems = usuario.tipo === 'admin'
    ? menuItems
    : menuItems.filter(item => !item.adminOnly)

  const handleLogout = async () => {
    await logoutUsuarioAction()
    router.push('/')
    router.refresh()
    onClose()
  }

  // Prevenir scroll del body cuando el sidebar está abierto en móvil
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <div
      className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-full
      `}
    >
      {/* Cabecera del sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <Link href="/dashboard" className="text-xl font-bold text-primary-600" onClick={onClose}>
          VentasYesStyle
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Menú */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          // Si es el botón de "Ver Tienda", usamos un estilo diferente
          if (item.isExternal) {
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-green-600 hover:bg-green-50 border border-green-200 mt-2"
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`
                flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Pie del sidebar (usuario y logout) */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
          <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
            {usuario.nombre_usuario.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{usuario.nombre_usuario}</p>
            <p className="text-xs text-gray-500 truncate">{usuario.tipo === 'admin' ? 'Administrador' : 'Usuario'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full mt-2 flex items-center justify-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  )
}