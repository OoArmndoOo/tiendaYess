// components/modals/ProductModal.tsx
'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

interface ProductModalProps {
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
  onClose: () => void
}

export default function ProductModal({ producto, onClose }: ProductModalProps) {
  // Cerrar con tecla ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // Cerrar al hacer clic fuera del modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const precioFormateado = new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB'
  }).format(producto.precio)

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header del modal */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-2xl font-bold text-gray-800">
            {producto.nombre_producto}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Galería de imágenes */}
          <div className="mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {producto.fotos && producto.fotos.length > 0 ? (
                producto.fotos.map((foto, index) => (
                  <div key={index} className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={foto.foto}
                      alt={`${producto.nombre_producto} - Imagen ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-3 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                  <p className="text-gray-400">Sin imágenes</p>
                </div>
              )}
            </div>
          </div>

          {/* Información del producto */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Categoría</label>
                <p className="text-gray-800">
                  {producto.tipos?.nombre_tipo || 'Sin categoría'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Precio</label>
                <p className="text-2xl font-bold text-primary-600">
                  {precioFormateado}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Stock disponible</label>
              <p className={`font-semibold ${producto.cantidad <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                {producto.cantidad <= 0 ? 'Agotado' : `${producto.cantidad} unidades`}
              </p>
            </div>

            {producto.detalles && (
              <div>
                <label className="text-sm font-medium text-gray-500">Detalles</label>
                <p className="text-gray-700 mt-1 whitespace-pre-wrap">
                  {producto.detalles}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}