// app/(dashboard)/dashboard/inventario/page.tsx
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Package, Edit, Eye, EyeOff } from 'lucide-react'

export default async function InventarioPage() {
  const { data: productos, error } = await supabase
    .from('productos')
    .select(`
      id_producto,
      nombre_producto,
      cantidad,
      precio,
      estado,
      tipos (nombre_tipo),
      fotos (foto)
    `)
    .order('id_producto', { ascending: false })

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error al cargar el inventario</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Inventario</h2>
        {/* ❌ ELIMINADO: Botón "Nuevo Producto" */}
      </div>

      {productos && productos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {productos.map((producto: any) => (
            <div key={producto.id_producto} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Imagen */}
              <div className="h-40 bg-gray-100 flex items-center justify-center">
                {producto.fotos?.[0]?.foto ? (
                  <img src={producto.fotos[0].foto} alt={producto.nombre_producto} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-12 h-12 text-gray-400" />
                )}
              </div>
              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 truncate">{producto.nombre_producto}</h3>
                <p className="text-sm text-gray-500">{producto.tipos?.nombre_tipo || 'Sin categoría'}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-primary-600">Bs {producto.precio?.toFixed(2) || '0'}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${producto.cantidad > 10 ? 'bg-green-100 text-green-700' : producto.cantidad > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    Stock: {producto.cantidad || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${producto.estado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {producto.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Link
                      href={`/dashboard/inventario/editar/${producto.id_producto}`}
                      className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      {producto.estado ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No hay productos en el inventario</p>
        </div>
      )}
    </div>
  )
}