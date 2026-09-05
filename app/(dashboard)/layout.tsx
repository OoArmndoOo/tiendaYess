// app/(dashboard)/layout.tsx
import { getCurrentUserAction } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import DashboardLayoutClient from './DashboardLayoutClient'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const usuario = await getCurrentUserAction()
  
  // Si el usuario no está autenticado, redirigir al login
  if (!usuario) {
    redirect('/')
  }

  return (
    <DashboardLayoutClient usuario={usuario}>
      {children}
    </DashboardLayoutClient>
  )
}