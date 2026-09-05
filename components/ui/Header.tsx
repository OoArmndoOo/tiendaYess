// components/ui/Header.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logoutUsuarioAction } from '@/lib/actions/auth'
import LoginForm from '@/components/forms/LoginForm'
import RegisterForm from '@/components/forms/RegisterForm'
import { SessionUser } from '@/types'
import { Menu, X } from 'lucide-react'

interface HeaderProps {
  usuario?: SessionUser | null
}

export default function Header({ usuario = null }: HeaderProps) {
  const router = useRouter()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logoutUsuarioAction()
    router.refresh()
  }

  if (usuario) {
    return (
      <>
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="text-2xl font-bold text-primary-600 flex-shrink-0">
                VentasYesStyle
              </Link>

              <nav className="hidden md:flex items-center space-x-8">
                <Link href="/categoria/ropa" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Ropa
                </Link>
                <Link href="/categoria/accesorios" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Accesorios
                </Link>
                <Link href="/categoria/calzado" className="text-gray-600 hover:text-primary-600 transition-colors">
                  Calzado
                </Link>
              </nav>

              <div className="flex items-center space-x-4">
                <Link 
                  href="/dashboard" 
                  className="hidden md:flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <span className="font-medium">{usuario.nombre_usuario}</span>
                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                    {usuario.tipo === 'admin' ? 'Admin' : 'User'}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden md:block px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Cerrar Sesión
                </button>

                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>

            {isMenuOpen && (
              <div className="md:hidden py-4 border-t border-gray-100 space-y-3">
                <Link 
                  href="/dashboard" 
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/categoria/ropa" 
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Ropa
                </Link>
                <Link 
                  href="/categoria/accesorios" 
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Accesorios
                </Link>
                <Link 
                  href="/categoria/calzado" 
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Calzado
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false)
                    handleLogout()
                  }}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </header>

        {isLoginOpen && (
          <LoginForm 
            onClose={() => setIsLoginOpen(false)} 
            onSwitchToRegister={() => {
              setIsLoginOpen(false)
              setIsRegisterOpen(true)
            }}
          />
        )}
        {isRegisterOpen && (
          <RegisterForm 
            onClose={() => setIsRegisterOpen(false)}
            onSwitchToLogin={() => {
              setIsRegisterOpen(false)
              setIsLoginOpen(true)
            }}
          />
        )}
      </>
    )
  }

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-primary-600 flex-shrink-0">
              VentasYesStyle
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/categoria/ropa" className="text-gray-600 hover:text-primary-600 transition-colors">
                Ropa
              </Link>
              <Link href="/categoria/accesorios" className="text-gray-600 hover:text-primary-600 transition-colors">
                Accesorios
              </Link>
              <Link href="/categoria/calzado" className="text-gray-600 hover:text-primary-600 transition-colors">
                Calzado
              </Link>
            </nav>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsLoginOpen(true)}
                className="hidden md:block px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="hidden md:block px-4 py-2 text-sm border-2 border-primary-500 text-primary-500 rounded-lg hover:bg-primary-50 transition-colors"
              >
                Registrarse
              </button>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100 space-y-3">
              <Link 
                href="/categoria/ropa" 
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Ropa
              </Link>
              <Link 
                href="/categoria/accesorios" 
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Accesorios
              </Link>
              <Link 
                href="/categoria/calzado" 
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setIsMenuOpen(false)}
              >
                Calzado
              </Link>
              <button
                onClick={() => {
                  setIsMenuOpen(false)
                  setIsLoginOpen(true)
                }}
                className="block w-full text-left px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg font-medium"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false)
                  setIsRegisterOpen(true)
                }}
                className="block w-full text-left px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg font-medium"
              >
                Registrarse
              </button>
            </div>
          )}
        </div>
      </header>

      {isLoginOpen && (
        <LoginForm 
          onClose={() => setIsLoginOpen(false)} 
          onSwitchToRegister={() => {
            setIsLoginOpen(false)
            setIsRegisterOpen(true)
          }}
        />
      )}
      {isRegisterOpen && (
        <RegisterForm 
          onClose={() => setIsRegisterOpen(false)}
          onSwitchToLogin={() => {
            setIsRegisterOpen(false)
            setIsLoginOpen(true)
          }}
        />
      )}
    </>
  )
}