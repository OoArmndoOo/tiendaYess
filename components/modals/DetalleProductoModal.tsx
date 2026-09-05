// components/modals/DetalleProductoModal.tsx
'use client'

import { useEffect, useState } from 'react'
import { X, Package, Calendar, Tag, DollarSign, Box, Info, Image, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface DetalleProductoModalProps {
  productoId: number
  isOpen: boolean
  onClose: () => void
}

interface ProductoDetalle {
  id_producto: number
  nombre_producto: string
  cantidad: number
  precio: number
  detalles: string
  estado: boolean
  fecha_creacion: string
  ultima_modificacion: string
  tipos: { nombre_tipo: string } | null
  fotos: { foto: string }[] | null
}

export default function DetalleProductoModal({ productoId, isOpen, onClose }: DetalleProductoModalProps) {
  const [loading, setLoading] = useState(true)
  const [producto, setProducto] = useState<ProductoDetalle | null>(null)
  const [imagenActual, setImagenActual] = useState(0)

  useEffect(() => {
    if (isOpen && productoId) {
      cargarDetalle()
    }
  }, [isOpen, productoId])

  const cargarDetalle = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('productos')
        .select(`
          id_producto,
          nombre_producto,
          cantidad,
          precio,
          detalles,
          estado,
          fecha_creacion,
          ultima_modificacion,
          tipos (nombre_tipo),
          fotos (foto)
        `)
        .eq('id_producto', productoId)
        .single()

      if (error) throw error
      setProducto(data)
      setImagenActual(0)
    } catch (error) {
      console.error('Error cargando detalle:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cerrar con tecla ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // Prevenir scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // ====== CARRUSEL INFINITO ======
  const imagenSiguiente = () => {
    if (!producto?.fotos || producto.fotos.length === 0) return
    setImagenActual((prev) => (prev + 1) % producto.fotos.length)
  }

  const imagenAnterior = () => {
    if (!producto?.fotos || producto.fotos.length === 0) return
    setImagenActual((prev) => (prev - 1 + producto.fotos.length) % producto.fotos.length)
  }

  // Navegación con teclas (flechas izquierda/derecha)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') imagenSiguiente()
      if (e.key === 'ArrowLeft') imagenAnterior()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [producto?.fotos?.length])

  if (!isOpen) return null

  const fotos = producto?.fotos || []
  const totalFotos = fotos.length

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary-500" />
            Detalle del Producto
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="overflow-y-auto max-h-[calc(90vh-4rem)]">
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
              <p className="text-gray-500 mt-3">Cargando detalles...</p>
            </div>
          ) : producto ? (
            <div className="p-6 space-y-6">
              {/* ====== GALERÍA DE IMÁGENES ====== */}
              <div>
                <div className="relative bg-gray-100 rounded-xl overflow-hidden aspect-video">
                  {totalFotos > 0 ? (
                    <>
                      {/* Fondo difuminado - opacidad 100% */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center blur-xl opacity-100"
                        style={{ backgroundImage: `url(${fotos[imagenActual]?.foto})` }}
                      />
                      
                      {/* Imagen principal - TAMAÑO COMPLETO */}
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                          src={fotos[imagenActual]?.foto} 
                          alt={`${producto.nombre_producto} - Imagen ${imagenActual + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      
                      {/* Controles del carrusel */}
                      {totalFotos > 1 && (
                        <>
                          <button
                            onClick={imagenAnterior}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                            aria-label="Imagen anterior"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={imagenSiguiente}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                            aria-label="Imagen siguiente"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      
                      {/* Contador de posición */}
                      <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-sm text-white text-xs rounded-full">
                        {imagenActual + 1} / {totalFotos}
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <Image className="w-16 h-16 mb-2" />
                      <span>Sin imágenes</span>
                    </div>
                  )}
                </div>
                
                {/* ====== MINIATURAS CENTRADAS ====== */}
                {totalFotos > 1 && (
                  <div className="mt-4">
                    <div className="flex justify-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {fotos.map((foto, index) => (
                        <button
                          key={index}
                          onClick={() => setImagenActual(index)}
                          className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
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
                      {totalFotos} {totalFotos === 1 ? 'foto' : 'fotos'}
                    </p>
                  </div>
                )}
              </div>

              {/* ====== INFORMACIÓN DEL PRODUCTO ====== */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna izquierda */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{producto.nombre_producto}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        producto.estado 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {producto.estado ? 'Activo' : 'Inactivo'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {producto.tipos?.nombre_tipo || 'Sin categoría'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        Precio
                      </p>
                      <p className="text-lg font-bold text-primary-600">
                        Bs {producto.precio?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Box className="w-3 h-3" />
                        Stock
                      </p>
                      <p className={`text-lg font-bold ${
                        producto.cantidad === 0 ? 'text-red-600' :
                        producto.cantidad <= 5 ? 'text-yellow-600' : 'text-gray-800'
                      }`}>
                        {producto.cantidad || 0} unidades
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Categoría
                    </p>
                    <p className="text-gray-800">{producto.tipos?.nombre_tipo || 'Sin categoría'}</p>
                  </div>
                </div>

                {/* Columna derecha */}
                <div className="space-y-4">
                  {producto.detalles && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Detalles
                      </p>
                      <p className="text-gray-700 whitespace-pre-wrap text-sm">
                        {producto.detalles}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Creado
                      </p>
                      <p className="text-sm text-gray-700">
                        {new Date(producto.fecha_creacion).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Últ. modificación
                      </p>
                      <p className="text-sm text-gray-700">
                        {new Date(producto.ultima_modificacion).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      ID Producto
                    </p>
                    <p className="text-sm text-gray-700 font-mono">#{producto.id_producto}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500">No se encontró el producto</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}