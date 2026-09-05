// app/(dashboard)/dashboard/perfil/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUserAction } from '@/lib/actions/auth'
import { SessionUser } from '@/types'
import { toast } from 'sonner'
import { User, Mail, Lock, Save, Eye, EyeOff } from 'lucide-react'

export default function PerfilPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<SessionUser | null>(null)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [contraseñaActual, setContraseñaActual] = useState('')
  const [nuevaContraseña, setNuevaContraseña] = useState('')
  const [confirmarContraseña, setConfirmarContraseña] = useState('')
  const [loading, setLoading] = useState(false)
  const [mostrarContraseña, setMostrarContraseña] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      const user = await getCurrentUserAction()
      if (user) {
        setUsuario(user)
        setNombre(user.nombre_usuario)
        setEmail(user.email)
      }
    }
    loadUser()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar que las contraseñas coincidan si se quiere cambiar
      if (nuevaContraseña || confirmarContraseña) {
        if (nuevaContraseña !== confirmarContraseña) {
          toast.error('Las contraseñas no coinciden')
          setLoading(false)
          return
        }
        if (nuevaContraseña.length < 6) {
          toast.error('La contraseña debe tener al menos 6 caracteres')
          setLoading(false)
          return
        }
      }

      // 1. Actualizar nombre y email
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          nombre_usuario: nombre.trim(),
          email: email.trim()
        })
        .eq('id_usuario', usuario?.id_usuario)

      if (updateError) throw new Error(updateError.message)

      // 2. Si se quiere cambiar la contraseña
      if (nuevaContraseña) {
        // Verificar que la contraseña actual sea correcta
        if (!contraseñaActual) {
          toast.error('Debes ingresar tu contraseña actual para cambiarla')
          setLoading(false)
          return
        }

        // Obtener la contraseña hasheada actual
        const { data: usuarioData, error: fetchError } = await supabase
          .from('usuarios')
          .select('contraseña')
          .eq('id_usuario', usuario?.id_usuario)
          .single()

        if (fetchError || !usuarioData) {
          throw new Error('No se pudo verificar la contraseña actual')
        }

        // Verificar la contraseña actual usando bcryptjs
        const bcrypt = require('bcryptjs')
        const isValid = await bcrypt.compare(contraseñaActual, usuarioData.contraseña)
        
        if (!isValid) {
          toast.error('La contraseña actual es incorrecta')
          setLoading(false)
          return
        }

        // Hashear nueva contraseña
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(nuevaContraseña, salt)

        const { error: passError } = await supabase
          .from('usuarios')
          .update({ contraseña: hash })
          .eq('id_usuario', usuario?.id_usuario)

        if (passError) throw new Error(passError.message)
      }

      toast.success('✅ Perfil actualizado correctamente')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  if (!usuario) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
          <p className="text-gray-500 mt-2">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header del perfil */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-8 text-white">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
              {usuario.nombre_usuario.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{usuario.nombre_usuario}</h2>
              <p className="text-white/80 text-sm">
                {usuario.tipo === 'admin' ? 'Administrador' : 'Usuario'} • {usuario.estado ? 'Activo' : 'Inactivo'}
              </p>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              Información Personal
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User className="w-4 h-4 inline mr-1" />
                Nombre de usuario
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                required
              />
            </div>
          </div>

          {/* Cambiar contraseña */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
              <Lock className="w-4 h-4 inline mr-1" />
              Cambiar Contraseña
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña actual
              </label>
              <div className="relative">
                <input
                  type={mostrarContraseña ? 'text' : 'password'}
                  value={contraseñaActual}
                  onChange={(e) => setContraseñaActual(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="Ingresa tu contraseña actual"
                />
                <button
                  type="button"
                  onClick={() => setMostrarContraseña(!mostrarContraseña)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {mostrarContraseña ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <input
                type={mostrarContraseña ? 'text' : 'password'}
                value={nuevaContraseña}
                onChange={(e) => setNuevaContraseña(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar nueva contraseña
              </label>
              <input
                type={mostrarContraseña ? 'text' : 'password'}
                value={confirmarContraseña}
                onChange={(e) => setConfirmarContraseña(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="Repite la nueva contraseña"
              />
            </div>

            <p className="text-xs text-gray-400">
              <span className="text-yellow-500">⚠️</span> Deja los campos de contraseña vacíos si no deseas cambiarla.
            </p>
          </div>

          {/* Botón guardar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Guardando cambios...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}