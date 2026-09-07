// app/(public)/page.tsx
import { supabase } from '@/lib/supabaseClient'
import ProductList from '@/components/ui/ProductList'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Obtener productos activos
  const { data: productos, error: productError } = await supabase
    .from('productos')
    .select(`
      id_producto,
      nombre_producto,
      cantidad,
      precio,
      detalles,
      estado,
      id_tipo,
      tipos (nombre_tipo),
      fotos (foto)
    `)
    .eq('estado', true)
    .order('id_producto', { ascending: false })

  // Obtener todos los tipos (categorías)
  const { data: tipos, error: tiposError } = await supabase
    .from('tipos')
    .select('id_tipo, nombre_tipo')
    .order('nombre_tipo')

  if (productError || tiposError) {
    console.error('Error cargando datos:', productError || tiposError)
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error al cargar los productos</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Hero / Banner */}
      <section className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-16 rounded-xl mb-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Bienvenido a VentasYesStyle
          </h1>
          <p className="text-lg md:text-2xl opacity-90">
            Encuentra los mejores productos de moda y estilo
          </p>
        </div>
      </section>

      {/* Productos con filtro */}
      <ProductList productos={productos || []} tipos={tipos || []} />
    </div>
  )
}