// app/(dashboard)/dashboard/page.tsx
import { supabase } from '@/lib/supabaseClient'
import { Package, ShoppingBag, Users, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  // Obtener estadísticas
  const { count: totalProductos } = await supabase
    .from('productos')
    .select('*', { count: 'exact', head: true })

  const { count: totalUsuarios } = await supabase
    .from('usuarios')
    .select('*', { count: 'exact', head: true })

  const { count: productosBajoStock } = await supabase
    .from('productos')
    .select('*', { count: 'exact', head: true })
    .lt('cantidad', 10)

  const { data: productos } = await supabase
    .from('productos')
    .select('precio, cantidad')

  const valorInventario = productos?.reduce((total, p) => total + (p.precio * p.cantidad), 0) || 0

  const estadisticas = [
    {
      titulo: 'Total Productos',
      valor: totalProductos || 0,
      icono: Package,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      titulo: 'Usuarios Registrados',
      valor: totalUsuarios || 0,
      icono: Users,
      color: 'bg-green-100 text-green-600',
    },
    {
      titulo: 'Stock Bajo',
      valor: productosBajoStock || 0,
      icono: ShoppingBag,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      titulo: 'Valor Inventario',
      valor: `Bs ${valorInventario.toLocaleString()}`,
      icono: TrendingUp,
      color: 'bg-purple-100 text-purple-600',
    },
  ]

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Resumen General</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {estadisticas.map((stat, index) => {
          const Icon = stat.icono
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.titulo}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stat.valor}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}