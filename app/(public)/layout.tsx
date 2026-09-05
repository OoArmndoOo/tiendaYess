// app/(public)/layout.tsx
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import { getCurrentUserAction } from '@/lib/actions/auth'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const usuario = await getCurrentUserAction()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header usuario={usuario} />
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}