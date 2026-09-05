// app/(dashboard)/dashboard/usuarios/page.tsx
import { supabase } from '@/lib/supabaseClient'
import { Users } from 'lucide-react'

export default async function UsuariosPage() {
  const { data: usuarios, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('id_usuario')

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error al cargar los usuarios</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Usuarios</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {usuarios && usuarios.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {usuarios.map((usuario: any) => (
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
                        {usuario.tipo === 'admin' ? 'Admin' : 'Usuario'}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No hay usuarios registrados</p>
          </div>
        )}
      </div>
    </div>
  )
}