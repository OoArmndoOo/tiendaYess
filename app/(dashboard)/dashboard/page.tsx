// app/(dashboard)/dashboard/page.tsx
import { supabase } from '@/lib/supabaseClient'
import { Package, ShoppingBag, Users, TrendingUp, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { cache } from 'react'

// ========== CACHÉ DE CONSULTAS ==========
const getDashboardData = cache(async () => {
  // Ejecutar todas las consultas en paralelo
  const [
    totalProductos,
    totalUsuarios,
    productosBajoStock,
    productosAgotados,
    usuariosInactivos,
    totalRegistrosHoy,
    productos,
    ultimosProductos,
    ultimosMovimientos
  ] = await Promise.all([
    // Contadores simples
    supabase.from('productos').select('*', { count: 'exact', head: true }),
    supabase.from('usuarios').select('*', { count: 'exact', head: true }),
    supabase.from('productos').select('*', { count: 'exact', head: true }).lt('cantidad', 10),
    supabase.from('productos').select('*', { count: 'exact', head: true }).eq('cantidad', 0),
    supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('estado', false),
    supabase.from('registros').select('*', { count: 'exact', head: true })
      .gte('fecha_registro', new Date(new Date().setHours(0,0,0,0)).toISOString()),
    // Productos para calcular valor
    supabase.from('productos').select('precio, cantidad'),
    // Últimos 5 productos
    supabase.from('productos')
      .select('id_producto, nombre_producto, precio, estado, tipos(nombre_tipo), fotos(foto)')
      .order('fecha_creacion', { ascending: false })
      .limit(5),
    // Últimos 5 movimientos
    supabase.from('registros')
      .select('id_registro, detalle_registro, fecha_registro, usuarios(nombre_usuario), productos(nombre_producto)')
      .order('fecha_registro', { ascending: false })
      .limit(5)
  ])

  return {
    totalProductos: totalProductos.count || 0,
    totalUsuarios: totalUsuarios.count || 0,
    productosBajoStock: productosBajoStock.count || 0,
    productosAgotados: productosAgotados.count || 0,
    usuariosInactivos: usuariosInactivos.count || 0,
    totalRegistrosHoy: totalRegistrosHoy.count || 0,
    valorInventario: productos.data?.reduce((total, p) => total + (p.precio * p.cantidad), 0) || 0,
    ultimosProductos: ultimosProductos.data || [],
    ultimosMovimientos: ultimosMovimientos.data || []
  }
})

export default async function DashboardPage() {
  const data = await getDashboardData()

  const estadisticas = [
    {
      titulo: 'Total Productos',
      valor: data.totalProductos,
      icono: Package,
      color: 'bg-blue-100 text-blue-600',
      link: '/dashboard/inventario'
    },
    {
      titulo: 'Usuarios Registrados',
      valor: data.totalUsuarios,
      icono: Users,
      color: 'bg-green-100 text-green-600',
      link: '/dashboard/usuarios',
      detalle: `${data.usuariosInactivos} inactivos`
    },
    {
      titulo: 'Stock Bajo',
      valor: data.productosBajoStock,
      icono: AlertCircle,
      color: 'bg-yellow-100 text-yellow-600',
      link: '/dashboard/inventario',
      detalle: `${data.productosAgotados} agotados`
    },
    {
      titulo: 'Valor Inventario',
      valor: `Bs ${data.valorInventario.toLocaleString()}`,
      icono: TrendingUp,
      color: 'bg-purple-100 text-purple-600',
      link: '/dashboard/inventario'
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Panel de Control</h2>
        <p className="text-sm text-gray-500">
          <Clock className="w-4 h-4 inline mr-1" />
          Última actualización: {new Date().toLocaleString('es-ES')}
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {estadisticas.map((stat, index) => {
          const Icon = stat.icono
          return (
            <Link key={index} href={stat.link || '#'} className="block">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.titulo}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{stat.valor}</p>
                    {stat.detalle && (
                      <p className="text-xs text-gray-400 mt-1">{stat.detalle}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Últimos productos y movimientos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Últimos Productos</h3>
            <Link href="/dashboard/inventario" className="text-sm text-primary-500 hover:underline">
              Ver todos →
            </Link>
          </div>
          {data.ultimosProductos && data.ultimosProductos.length > 0 ? (
            <div className="space-y-3">
              {data.ultimosProductos.map((producto: any) => (
                <div key={producto.id_producto} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-500 overflow-hidden flex-shrink-0">
                    {producto.fotos?.[0]?.foto ? (
                      <img src={producto.fotos[0].foto} alt={producto.nombre_producto} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{producto.nombre_producto}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-gray-500">{producto.tipos?.nombre_tipo || 'Sin categoría'}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${producto.estado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {producto.estado ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    Bs {producto.precio?.toFixed(2) || '0'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No hay productos aún</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Actividad Reciente</h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-400">Hoy: {data.totalRegistrosHoy}</span>
              <Link href="/dashboard/registros" className="text-sm text-primary-500 hover:underline">
                Ver todos →
              </Link>
            </div>
          </div>
          {data.ultimosMovimientos && data.ultimosMovimientos.length > 0 ? (
            <div className="space-y-3">
              {data.ultimosMovimientos.map((movimiento: any) => {
                let colorClass = 'text-gray-600'
                if (movimiento.detalle_registro.includes('Creación')) colorClass = 'text-green-600'
                if (movimiento.detalle_registro.includes('Eliminación')) colorClass = 'text-red-600'
                if (movimiento.detalle_registro.includes('Desactivación')) colorClass = 'text-yellow-600'
                if (movimiento.detalle_registro.includes('Activación')) colorClass = 'text-blue-600'
                
                return (
                  <div key={movimiento.id_registro} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="mt-0.5">
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${colorClass} truncate`}>
                        {movimiento.detalle_registro}
                      </p>
                      <p className="text-xs text-gray-500">
                        {movimiento.usuarios?.nombre_usuario || 'Sistema'} • {movimiento.productos?.nombre_producto || 'Producto eliminado'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(movimiento.fecha_registro).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No hay movimientos registrados</p>
          )}
        </div>
      </div>
    </div>
  )
}