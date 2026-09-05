// app/categoria/[slug]/page.tsx
import { supabase } from '@/lib/supabaseClient'
import ProductCard from '@/components/ui/ProductCard'
import { notFound } from 'next/navigation'
import { Tipo } from '@/types'

export default async function CategoriaPage({ params }: { params: { slug: string } }) {
  // Tipamos la respuesta con "as any" para evitar errores
  const { data: tipo, error: tipoError } = await supabase
    .from('tipos')
    .select('id_tipo, nombre_tipo')
    .eq('nombre_tipo', params.slug)
    .single() as any

  if (tipoError || !tipo) {
    notFound()
  }

  const { data: productos, error: productosError } = await supabase
    .from('productos')
    .select(`
      id_producto,
      nombre_producto,
      cantidad,
      precio,
      detalles,
      tipos (nombre_tipo),
      fotos (foto)
    `)
    .eq('id_tipo', tipo.id_tipo)
    .eq('estado', true) as any

  if (productosError) {
    console.error('Error cargando productos:', productosError)
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error al cargar los productos</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{tipo.nombre_tipo}</h1>
      {productos && productos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productos.map((producto: any) => (
            <ProductCard key={producto.id_producto} producto={producto} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No hay productos en esta categoría</p>
      )}
    </div>
  )
}