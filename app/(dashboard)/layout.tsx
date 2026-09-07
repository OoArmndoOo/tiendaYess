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
  
  if (!usuario) {
    redirect('/')
  }

  return (
    <DashboardLayoutClient usuario={usuario}>
      {children}
    </DashboardLayoutClient>
  )
}