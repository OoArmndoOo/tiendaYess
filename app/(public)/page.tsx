// app/(public)/page.tsx
import { supabase } from '@/lib/supabaseClient'
import ProductCard from '@/components/ui/ProductCard'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { data: productos, error } = await supabase
    .from('productos')
    .select(`
      id_producto,
      nombre_producto,
      cantidad,
      precio,
      detalles,
      estado,
      tipos (nombre_tipo),
      fotos (foto)
    `)
    .eq('estado', true)
    .order('id_producto', { ascending: false })

  if (error) {
    console.error('Error cargando productos:', error)
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error al cargar los productos</p>
      </div>
    )
  }

  return (
    <div>
      <section className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-16 rounded-xl mb-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bienvenido a VentasYesStyle
          </h1>
          <p className="text-xl md:text-2xl opacity-90">
            Encuentra los mejores productos de moda y estilo
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Productos Destacados
        </h2>
        
        {productos && productos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productos.map((producto: any) => (
              <ProductCard key={producto.id_producto} producto={producto} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <p className="text-gray-500">
              No hay productos disponibles en este momento
            </p>
          </div>
        )}
      </section>
    </div>
  )
}