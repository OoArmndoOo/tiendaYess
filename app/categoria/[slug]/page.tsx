// app/categoria/[slug]/page.tsx
import { supabase } from '@/lib/supabaseClient'
import ProductCard from '@/components/ui/ProductCard'
import { notFound } from 'next/navigation'

// Función para crear slug desde nombre
function createSlug(nombre: string) {
  return nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-')
}

// Función para obtener nombre desde slug
function getNombreFromSlug(slug: string, tipos: any[]) {
  const tipo = tipos.find(t => createSlug(t.nombre_tipo) === slug)
  return tipo?.nombre_tipo || null
}

export default async function CategoriaPage({ params }: { params: { slug: string } }) {
  // Obtener todos los tipos para buscar por slug
  const { data: tipos } = await supabase
    .from('tipos')
    .select('id_tipo, nombre_tipo')

  if (!tipos || tipos.length === 0) {
    notFound()
  }

  // Buscar el tipo por slug
  const nombreTipo = getNombreFromSlug(params.slug, tipos)
  if (!nombreTipo) {
    notFound()
  }

  // Obtener el id del tipo
  const tipo = tipos.find(t => t.nombre_tipo === nombreTipo)
  if (!tipo) {
    notFound()
  }

  // Obtener productos de esa categoría
  const { data: productos, error } = await supabase
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
    .eq('estado', true)

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
      <h1 className="text-3xl font-bold mb-6">{nombreTipo}</h1>
      {productos && productos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productos.map((producto: any) => (
            <ProductCard key={producto.id_producto} producto={producto} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">No hay productos en esta categoría</p>
        </div>
      )}
    </div>
  )
}