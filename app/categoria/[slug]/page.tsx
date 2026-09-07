// app/categoria/[slug]/page.tsx
import { supabase } from '@/lib/supabaseClient'
import ProductCard from '@/components/ui/ProductCard'
import { notFound } from 'next/navigation'

// ============================================================
// FUNCIONES DE UTILIDAD
// ============================================================

/**
 * Convierte un nombre de categoría en un slug amigable para URLs
 * Ejemplo: "Ropa Deportiva" → "ropa-deportiva"
 */
function createSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
}

/**
 * Busca el nombre de la categoría a partir del slug
 */
function getNombreFromSlug(slug: string, tipos: any[]): string | null {
  const tipo = tipos.find(t => createSlug(t.nombre_tipo) === slug)
  return tipo?.nombre_tipo || null
}

// ============================================================
// PÁGINA DE CATEGORÍA
// ============================================================

export default async function CategoriaPage({ params }: { params: { slug: string } }) {
  // 1. Obtener todos los tipos para buscar por slug
  const { data: tipos, error: tiposError } = await supabase
    .from('tipos')
    .select('id_tipo, nombre_tipo') as any // <-- CORREGIDO: tipado any

  if (tiposError || !tipos || tipos.length === 0) {
    console.error('Error cargando tipos:', tiposError)
    notFound()
  }

  // 2. Buscar el tipo por slug
  const nombreTipo = getNombreFromSlug(params.slug, tipos)
  if (!nombreTipo) {
    notFound()
  }

  // 3. Obtener el id del tipo
  const tipo = tipos.find((t: any) => t.nombre_tipo === nombreTipo)
  if (!tipo) {
    notFound()
  }

  // 4. Obtener productos de esa categoría
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
    .eq('estado', true) as any // <-- CORREGIDO: tipado any

  if (productosError) {
    console.error('Error cargando productos:', productosError)
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error al cargar los productos</p>
        <p className="text-sm text-gray-500 mt-2">{productosError.message}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{nombreTipo}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {productos?.length || 0} productos encontrados
        </p>
      </div>

      {/* Grid de productos */}
      {productos && productos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productos.map((producto: any) => (
            <ProductCard key={producto.id_producto} producto={producto} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">No hay productos en esta categoría</p>
          <p className="text-sm text-gray-400 mt-2">
            Vuelve a la <a href="/" className="text-primary-500 hover:underline">página principal</a> para ver todos los productos
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// GENERACIÓN DE RUTAS ESTÁTICAS (opcional, mejora rendimiento)
// ============================================================

// Descomenta esta función si quieres prerenderizar todas las categorías
// (recomendado para mejorar el SEO y la velocidad de carga)

/*
export async function generateStaticParams() {
  const { data: tipos, error } = await supabase
    .from('tipos')
    .select('nombre_tipo')
    .order('nombre_tipo')

  if (error || !tipos) {
    console.error('Error generando rutas estáticas:', error)
    return []
  }

  return tipos.map((tipo: any) => ({
    slug: createSlug(tipo.nombre_tipo),
  }))
}
*/

// Revalidación para actualizar datos cada 60 segundos (en producción)
export const revalidate = 60