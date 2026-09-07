// components/ui/ProductList.tsx
'use client'

import { useState, useMemo } from 'react'
import ProductCard from './ProductCard'

interface ProductListProps {
  productos: any[]
  tipos: any[]
}

const PRODUCTOS_INICIALES = 8
const PRODUCTOS_POR_CARGA = 8

export default function ProductList({ productos, tipos }: ProductListProps) {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null)
  const [limite, setLimite] = useState(PRODUCTOS_INICIALES)

  // Productos filtrados según categoría
  const productosFiltrados = useMemo(() => {
    if (!categoriaSeleccionada) return productos
    return productos.filter(p => p.tipos?.nombre_tipo === categoriaSeleccionada)
  }, [productos, categoriaSeleccionada])

  // Productos visibles según el límite
  const productosVisibles = useMemo(() => {
    return productosFiltrados.slice(0, limite)
  }, [productosFiltrados, limite])

  const hayMasProductos = limite < productosFiltrados.length
  const totalProductos = productosFiltrados.length

  const handleCargarMas = () => {
    setLimite(prev => prev + PRODUCTOS_POR_CARGA)
  }

  const handleCambiarCategoria = (categoria: string | null) => {
    setCategoriaSeleccionada(categoria)
    setLimite(PRODUCTOS_INICIALES) // Reiniciar límite al cambiar de categoría
  }

  return (
    <section>
      {/* Encabezado con título y filtros */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Productos Destacados
        </h2>

        {/* Filtros por categoría */}
        {tipos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCambiarCategoria(null)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                !categoriaSeleccionada
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {tipos.map((tipo) => (
              <button
                key={tipo.id_tipo}
                onClick={() => handleCambiarCategoria(tipo.nombre_tipo)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  categoriaSeleccionada === tipo.nombre_tipo
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tipo.nombre_tipo}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contador de productos */}
      <p className="text-sm text-gray-500 mb-4">
        Mostrando {productosVisibles.length} de {totalProductos} productos
        {categoriaSeleccionada && ` en "${categoriaSeleccionada}"`}
      </p>

      {/* Grid de productos */}
      {productosVisibles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productosVisibles.map((producto) => (
            <ProductCard key={producto.id_producto} producto={producto} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">
            No hay productos en esta categoría
          </p>
        </div>
      )}

      {/* Botón "Cargar más" */}
      {hayMasProductos && (
        <div className="flex justify-center mt-8">
          <button
            onClick={handleCargarMas}
            className="px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors shadow-sm"
          >
            Cargar más productos ({limite - PRODUCTOS_INICIALES} de {totalProductos - PRODUCTOS_INICIALES} restantes)
          </button>
        </div>
      )}

      {/* Mensaje cuando no hay más productos */}
      {!hayMasProductos && totalProductos > 0 && (
        <div className="text-center mt-8 text-sm text-gray-400">
          Todos los productos cargados
        </div>
      )}
    </section>
  )
}