// app/(dashboard)/dashboard/perfil/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { getCurrentUserAction } from '@/lib/actions/auth'
import { SessionUser } from '@/types'
import { toast } from 'sonner'
import bcrypt from 'bcryptjs'

export default function PerfilPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<SessionUser | null>(null)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [contraseñaActual, setContraseñaActual] = useState('')
  const [nuevaContraseña, setNuevaContraseña] = useState('')
  const [confirmarContraseña, setConfirmarContraseña] = useState('')
  const [loading, setLoading] = useState(false)

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
          nombre_usuario: nombre,
          email: email
        })
        .eq('id_usuario', usuario?.id_usuario)

      if (updateError) throw new Error(updateError.message)

      // 2. Si se quiere cambiar la contraseña
      if (nuevaContraseña) {
        // Verificar la contraseña actual
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('contraseña')
          .eq('id_usuario', usuario?.id_usuario)
          .single()

        if (!usuarioData) throw new Error('Usuario no encontrado')

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

      toast.success('Perfil actualizado correctamente')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al actualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  if (!usuario) {
    return <div className="text-center py-12">Cargando...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de usuario
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Cambiar Contraseña</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña actual (requerida para cambiar)
                </label>
                <input
                  type="password"
                  value={contraseñaActual}
                  onChange={(e) => setContraseñaActual(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva contraseña
                </label>
                <input
                  type="password"
                  value={nuevaContraseña}
                  onChange={(e) => setNuevaContraseña(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar nueva contraseña
                </label>
                <input
                  type="password"
                  value={confirmarContraseña}
                  onChange={(e) => setConfirmarContraseña(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-500 text-white py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}