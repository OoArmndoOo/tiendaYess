// app/(dashboard)/dashboard/usuarios/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Users, UserCheck, UserX, Shield, ShieldOff, Search, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Usuario {
  id_usuario: number
  nombre_usuario: string
  email: string
  tipo: 'admin' | 'user'
  estado: boolean
  fecha_creacion: string
}

export default function UsuariosPage() {
  const router = useRouter()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const cargarUsuarios = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('id_usuario')

      if (error) throw error
      setUsuarios(data || [])
      setUsuariosFiltrados(data || [])
    } catch (error) {
      console.error('Error cargando usuarios:', error)
      toast.error('Error al cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarUsuarios()
  }, [])

  useEffect(() => {
    let filtrados = usuarios

    if (searchTerm.trim()) {
      filtrados = filtrados.filter(u =>
        u.nombre_usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filtroTipo) {
      filtrados = filtrados.filter(u => u.tipo === filtroTipo)
    }

    if (filtroEstado) {
      filtrados = filtrados.filter(u => u.estado === (filtroEstado === 'activo'))
    }

    setUsuariosFiltrados(filtrados)
  }, [searchTerm, filtroTipo, filtroEstado, usuarios])

  const handleToggleEstado = async (id: number, estadoActual: boolean) => {
    const nuevoEstado = !estadoActual
    const { error } = await supabase
      .from('usuarios')
      .update({ estado: nuevoEstado })
      .eq('id_usuario', id) as any // <-- CORRECCIÓN

    if (error) {
      toast.error('Error al cambiar estado del usuario')
      return
    }

    toast.success(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'}`)
    cargarUsuarios()
    router.refresh()
  }

  const handleToggleRol = async (id: number, rolActual: string) => {
    const nuevoRol = rolActual === 'admin' ? 'user' : 'admin'
    const { error } = await supabase
      .from('usuarios')
      .update({ tipo: nuevoRol })
      .eq('id_usuario', id) as any // <-- CORRECCIÓN

    if (error) {
      toast.error('Error al cambiar rol del usuario')
      return
    }

    toast.success(`Usuario ahora es ${nuevoRol === 'admin' ? 'Administrador' : 'Usuario'}`)
    cargarUsuarios()
    router.refresh()
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Usuarios</h2>
          <p className="text-sm text-gray-500">
            {usuarios.length} usuarios registrados
          </p>
        </div>
        <button
          onClick={cargarUsuarios}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Actualizar"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="user">Usuarios</option>
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
            <p className="text-gray-500 mt-2">Cargando usuarios...</p>
          </div>
        ) : usuariosFiltrados.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Registro</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id_usuario} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      {usuario.nombre_usuario}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {usuario.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        usuario.tipo === 'admin' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {usuario.tipo === 'admin' ? 'Administrador' : 'Usuario'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        usuario.estado 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {usuario.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(usuario.fecha_creacion).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Cambiar rol */}
                        <button
                          onClick={() => handleToggleRol(usuario.id_usuario, usuario.tipo)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            usuario.tipo === 'admin'
                              ? 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50'
                              : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
                          }`}
                          title={usuario.tipo === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                        >
                          {usuario.tipo === 'admin' ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </button>

                        {/* Activar/Desactivar */}
                        <button
                          onClick={() => handleToggleEstado(usuario.id_usuario, usuario.estado)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            usuario.estado
                              ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                              : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
                          }`}
                          title={usuario.estado ? 'Desactivar' : 'Activar'}
                        >
                          {usuario.estado ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              {searchTerm || filtroTipo || filtroEstado
                ? 'No hay usuarios que coincidan con los filtros'
                : 'No hay usuarios registrados'}
            </p>
            {(searchTerm || filtroTipo || filtroEstado) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFiltroTipo('')
                  setFiltroEstado('')
                }}
                className="text-primary-500 hover:underline text-sm mt-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}