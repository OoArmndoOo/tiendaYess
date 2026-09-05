// components/ui/ProductCard.tsx
'use client'

import { useState } from 'react'
import ProductModal from '@/components/modals/ProductModal'
import { Package, Image as ImageIcon } from 'lucide-react'

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
  
  const imagenPrincipal = producto.fotos && producto.fotos.length > 0
    ? producto.fotos[0].foto
    : null

  const totalFotos = producto.fotos?.length || 0

  const precioFormateado = new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB'
  }).format(producto.precio)

  return (
    <>
      <div 
        className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col"
        onClick={() => setIsModalOpen(true)}
      >
        {/* ====== IMAGEN CON EFECTO BLUR ====== */}
        <div className="relative h-56 w-full overflow-hidden bg-gray-100 flex-shrink-0">
          {/* Fondo difuminado (solo como respaldo) */}
          {imagenPrincipal && (
            <div 
              className="absolute inset-0 bg-cover bg-center blur-xl opacity-100"
              style={{ backgroundImage: `url(${imagenPrincipal})` }}
            />
          )}
          
          {/* Imagen principal - TAMAÑO COMPLETO */}
          <div className="relative w-full h-full flex items-center justify-center">
            {imagenPrincipal ? (
              <img 
                src={imagenPrincipal} 
                alt={producto.nombre_producto} 
                className="w-full h-full object-contain"
              />
            ) : (
              <Package className="w-16 h-16 text-gray-300" />
            )}
          </div>
          
          {/* Badge de stock en la imagen */}
          {producto.cantidad <= 0 && (
            <div className="absolute top-3 right-3">
              <span className="px-2.5 py-1 bg-red-500/90 text-white text-xs font-semibold rounded-full shadow-sm">
                Agotado
              </span>
            </div>
          )}
          {producto.cantidad > 0 && producto.cantidad <= 5 && (
            <div className="absolute top-3 right-3">
              <span className="flex items-center gap-1 px-2.5 py-1 bg-yellow-500/90 text-white text-xs font-semibold rounded-full shadow-sm">
                Stock bajo
              </span>
            </div>
          )}

          {/* ====== CONTADOR DE FOTOS ====== */}
          {totalFotos > 0 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-full">
              <ImageIcon className="w-3 h-3" />
              <span>{totalFotos}</span>
            </div>
          )}
        </div>

        {/* ====== CONTENIDO ====== */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-800 text-lg mb-1 line-clamp-1">
            {producto.nombre_producto}
          </h3>
          
          {producto.tipos && (
            <p className="text-sm text-gray-500 mb-2">
              {producto.tipos.nombre_tipo}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-auto">
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

      {/* ====== MODAL DE DETALLES ====== */}
      {isModalOpen && (
        <ProductModal 
          producto={producto}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}