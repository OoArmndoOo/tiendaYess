// components/modals/ProductModal.tsx
'use client'

import { useEffect, useState } from 'react'
import { X, Package, ChevronLeft, ChevronRight, Image as ImageIcon, Tag, DollarSign, Info, Expand } from 'lucide-react'
import ImageGallery from './ImageGallery'

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
  const [imagenActual, setImagenActual] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const fotos = producto.fotos || []

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

  // Prevenir scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // ====== CARRUSEL INFINITO ======
  const imagenSiguiente = () => {
    if (fotos.length === 0) return
    setImagenActual((prev) => (prev + 1) % fotos.length)
  }

  const imagenAnterior = () => {
    if (fotos.length === 0) return
    setImagenActual((prev) => (prev - 1 + fotos.length) % fotos.length)
  }

  // Navegación con teclas (flechas izquierda/derecha)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') imagenSiguiente()
      if (e.key === 'ArrowLeft') imagenAnterior()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fotos.length])

  const precioFormateado = new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB'
  }).format(producto.precio)

  // Obtener URLs de todas las fotos
  const imageUrls = fotos.map(f => f.foto)

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-base sm:text-xl font-bold text-gray-800 flex items-center gap-2">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
              <span className="truncate max-w-[120px] sm:max-w-none">Detalle del Producto</span>
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-full transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Contenido */}
          <div className="overflow-y-auto max-h-[calc(95vh-4rem)] sm:max-h-[calc(90vh-4rem)] p-3 sm:p-6">
            {/* ====== GALERÍA DE IMÁGENES ====== */}
            <div className="mb-4 sm:mb-6">
              <div 
                className="relative bg-gray-100 rounded-xl overflow-hidden aspect-[4/3] sm:aspect-video cursor-pointer group"
                onClick={() => {
                  if (fotos.length > 0) {
                    setIsGalleryOpen(true)
                  }
                }}
              >
                {fotos.length > 0 ? (
                  <>
                    {/* Fondo difuminado */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center blur-xl opacity-100"
                      style={{ backgroundImage: `url(${fotos[imagenActual]?.foto})` }}
                    />
                    
                    {/* Imagen principal */}
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img 
                        src={fotos[imagenActual]?.foto} 
                        alt={`${producto.nombre_producto} - Imagen ${imagenActual + 1}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    {/* Overlay de "tocar para expandir" */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                      <div className="bg-white/90 rounded-full p-2 sm:p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                        <Expand className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                      </div>
                    </div>
                    
                    {/* Controles del carrusel */}
                    {fotos.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); imagenAnterior() }}
                          className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                          aria-label="Imagen anterior"
                        >
                          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); imagenSiguiente() }}
                          className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                          aria-label="Imagen siguiente"
                        >
                          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                      </>
                    )}
                    
                    {/* Contador de posición */}
                    <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 px-2 py-0.5 sm:px-3 sm:py-1 bg-black/60 backdrop-blur-sm text-white text-xs sm:text-sm rounded-full">
                      {imagenActual + 1} / {fotos.length}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 mb-2" />
                    <span className="text-sm sm:text-base">Sin imágenes</span>
                  </div>
                )}
              </div>
              
              {/* ====== MINIATURAS ====== */}
              {fotos.length > 1 && (
                <div className="mt-3 sm:mt-4">
                  <div className="flex justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {fotos.map((foto, index) => (
                      <button
                        key={index}
                        onClick={() => setImagenActual(index)}
                        className={`relative flex-shrink-0 w-14 h-14 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          index === imagenActual 
                            ? 'border-primary-500 ring-2 ring-primary-200 scale-105' 
                            : 'border-gray-200 hover:border-gray-400 hover:scale-105'
                        }`}
                      >
                        <img 
                          src={foto.foto} 
                          alt={`Miniatura ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {index === imagenActual && (
                          <div className="absolute inset-0 bg-primary-500/10"></div>
                        )}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-1">
                    {fotos.length} {fotos.length === 1 ? 'foto' : 'fotos'} • Toca la imagen para expandir
                  </p>
                </div>
              )}
            </div>

            {/* ====== INFORMACIÓN DEL PRODUCTO ====== */}
            <div className="space-y-3 sm:space-y-4">
              <div>
                <h3 className="text-lg sm:text-2xl font-bold text-gray-800">
                  {producto.nombre_producto}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                <span className="text-sm sm:text-base text-gray-600">
                  {producto.tipos?.nombre_tipo || 'Sin categoría'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <span className="text-xl sm:text-2xl font-bold text-primary-600">
                  {precioFormateado}
                </span>
              </div>

              {producto.detalles && (
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                    <p className="text-xs sm:text-sm font-medium text-gray-600">Detalles</p>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">
                    {producto.detalles}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ====== GALERÍA A PANTALLA COMPLETA ====== */}
      {isGalleryOpen && (
        <ImageGallery
          images={imageUrls}
          initialIndex={imagenActual}
          onClose={() => setIsGalleryOpen(false)}
        />
      )}
    </>
  )
}