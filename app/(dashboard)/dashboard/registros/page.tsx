// app/(dashboard)/dashboard/registros/page.tsx
import { supabase } from '@/lib/supabaseClient'
import { Clock } from 'lucide-react'

export default async function RegistrosPage() {
  const { data: registros, error } = await supabase
    .from('registros')
    .select(`
      id_registro,
      detalle_registro,
      fecha_registro,
      usuarios (nombre_usuario),
      productos (nombre_producto)
    `)
    .order('fecha_registro', { ascending: false })
    .limit(50)

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error al cargar los registros</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Registros de Actividad</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {registros && registros.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {registros.map((registro: any) => (
                  <tr key={registro.id_registro} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(registro.fecha_registro).toLocaleString('es-ES')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {registro.usuarios?.nombre_usuario || 'Sistema'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {registro.productos?.nombre_producto || 'Eliminado'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {registro.detalle_registro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No hay registros de actividad</p>
          </div>
        )}
      </div>
    </div>
  )
}