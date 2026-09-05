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
    <>
      <Header usuario={usuario} />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </main>
      <Footer />
    </>
  )
}