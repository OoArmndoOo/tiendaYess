// components/ui/ProductCard.tsx
'use client'

import Image from 'next/image'
import { useState } from 'react'
import ProductModal from '@/components/modals/ProductModal'

interface ProductCardProps {
  producto: {
    id_producto: number
    nombre_producto: string
    cantidad: number
    precio: number
    detalles: string
    tipos?: {
      nombre_tipo: string
    }
    fotos?: Array<{
      foto: string
    }>
  }
}

export default function ProductCard({ producto }: ProductCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Obtener la primera foto o usar placeholder
  const imagenPrincipal = producto.fotos && producto.fotos.length > 0
    ? producto.fotos[0].foto
    : '/images/placeholder.jpg'

  // Formatear precio
  const precioFormateado = new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB'
  }).format(producto.precio)

  return (
    <>
      <div 
        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Imagen */}
        <div className="relative h-48 w-full bg-gray-200">
          <Image
            src={imagenPrincipal}
            alt={producto.nombre_producto}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Badge de stock */}
          {producto.cantidad <= 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
              Agotado
            </div>
          )}
          {producto.cantidad > 0 && producto.cantidad <= 5 && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
              Últimas unidades
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-800 text-lg mb-1 line-clamp-1">
            {producto.nombre_producto}
          </h3>
          
          {producto.tipos && (
            <p className="text-sm text-gray-500 mb-2">
              {producto.tipos.nombre_tipo}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-primary-600">
              {precioFormateado}
            </span>
            {producto.cantidad > 0 && (
              <span className="text-sm text-gray-500">
                Stock: {producto.cantidad}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Modal de detalles */}
      {isModalOpen && (
        <ProductModal 
          producto={producto}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}