// app/(dashboard)/DashboardLayoutClient.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Sidebar from '@/components/ui/Sidebar'
import DashboardHeader from '@/components/ui/DashboardHeader'
import { SessionUser } from '@/types'

export default function DashboardLayoutClient({
  children,
  usuario,
}: {
  children: React.ReactNode
  usuario: SessionUser
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Cerrar el sidebar automáticamente al cambiar de ruta (en móviles)
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  // Cerrar al redimensionar a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - siempre presente en desktop, toggle en móvil */}
      <Sidebar
        usuario={usuario}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Overlay para móvil (fondo oscuro) */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader
          usuario={usuario}
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}