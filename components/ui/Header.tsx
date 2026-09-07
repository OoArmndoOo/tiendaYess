// components/ui/Header.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logoutUsuarioAction } from '@/lib/actions/auth'
import LoginForm from '@/components/forms/LoginForm'
import RegisterForm from '@/components/forms/RegisterForm'
import { SessionUser } from '@/types'
import { Menu, X, User } from 'lucide-react'

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

  const isLoggedIn = !!usuario

  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="text-2xl font-bold text-primary-600 flex-shrink-0">
              VentasYesStyle
            </Link>

            {/* ====== ACCIONES EN ESCRITORIO (visibles solo en desktop) ====== */}
            <div className="hidden md:flex items-center space-x-4">
              {isLoggedIn ? (
                <>
                  <Link 
                    href="/dashboard" 
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <span className="font-medium">{usuario.nombre_usuario}</span>
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                      {usuario.tipo === 'admin' ? 'Admin' : 'User'}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => setIsRegisterOpen(true)}
                    className="px-4 py-2 text-sm border-2 border-primary-500 text-primary-500 rounded-lg hover:bg-primary-50 transition-colors"
                  >
                    Registrarse
                  </button>
                </>
              )}
            </div>

            {/* Botón Hamburguesa - visible solo en móvil */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Menú"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* ====== MENÚ MÓVIL (con nombre y cerrar sesión) ====== */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
            <div className="container mx-auto px-4 py-4 space-y-3">
              {isLoggedIn ? (
                <>
                  {/* Nombre del usuario */}
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 rounded-lg">
                    <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold">
                      {usuario.nombre_usuario.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{usuario.nombre_usuario}</p>
                      <p className="text-xs text-gray-500">{usuario.tipo === 'admin' ? 'Administrador' : 'Usuario'}</p>
                    </div>
                  </div>

                  <Link 
                    href="/dashboard" 
                    className="block px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      handleLogout()
                    }}
                    className="block w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      setIsLoginOpen(true)
                    }}
                    className="block w-full text-left px-4 py-3 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false)
                      setIsRegisterOpen(true)
                    }}
                    className="block w-full text-left px-4 py-3 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium"
                  >
                    Registrarse
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Modales */}
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