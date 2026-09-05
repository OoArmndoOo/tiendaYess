// app/(dashboard)/DashboardLayoutClient.tsx
'use client'

import { useState } from 'react'
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        usuario={usuario} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
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