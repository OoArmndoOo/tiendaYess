// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VentasYesStyle - Tienda de Moda',
  description: 'Encuentra los mejores productos de moda y estilo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}