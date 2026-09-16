import { supabase } from '@/lib/supabaseClient'
import ProductList from '@/components/ui/ProductList'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // Obtener productos activos con datos del vendedor
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
      id_usuario,
      tipos (nombre_tipo),
      fotos (foto),
      usuarios (telefono, nombre_usuario)
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
      {/* Hero / Banner con Logo de Fondo */}
      {/* 1. Añadimos 'relative' para que el logo posicionado absolutamente se contenga aquí */}
      <section className="relative bg-gradient-to-r from-primary-600 to-secondary-600 text-white py-24 rounded-2xl mb-8 overflow-hidden shadow-xl">
        
        {/* 2. Capa del Logo de Fondo (Marca de Agua) */}
        <div className="absolute inset-0 z-0 opacity-100"> 
          <Image 
            src="/logo.png" // Asegúrate de tener tu logo en /public/logo.png
            alt="Alis Shop Background Logo" 
            fill
            className="object-cover md:object-contain" // Cubre todo el fondo, manteniendo proporción en pantallas grandes
            priority
          />
        </div>

        {/* 3. Capa de Contenido (Texto) - 'relative z-10' asegura que esté por encima del logo */}
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">
            Bienvenido a Alis Shop
          </h1>
          <p className="text-xl md:text-3xl font-light opacity-95 max-w-3xl mx-auto">
            Encuentra productos originales de la pagina YesStyle
          </p>
        </div>
      </section>

      {/* Productos con filtro */}
      <ProductList productos={productos || []} tipos={tipos || []} />
    </div>
  )
}