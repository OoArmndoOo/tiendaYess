// components/modals/ImageGallery.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'

interface ImageGalleryProps {
  images: string[]
  initialIndex: number
  onClose: () => void
}

export default function ImageGallery({ images, initialIndex, onClose }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

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
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Resetear zoom al cambiar de imagen
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [currentIndex])

  // Calcular tamaño de la imagen
  useEffect(() => {
    const img = imageRef.current
    if (img) {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
    }
  }, [currentIndex])

  const imagenSiguiente = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const imagenAnterior = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleZoomIn = () => {
    setScale(Math.min(scale * 1.5, 4))
  }

  const handleZoomOut = () => {
    setScale(Math.max(scale / 1.5, 0.5))
  }

  const handleReset = () => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      setScale(Math.min(scale * 1.1, 4))
    } else {
      setScale(Math.max(scale / 1.1, 0.5))
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Gestos táctiles para móvil
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0, distance: 0 })
  const [isPinching, setIsPinching] = useState(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true)
      setTouchStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
        distance: 0
      })
    }
    if (e.touches.length === 2) {
      setIsPinching(true)
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY)
      setTouchStart({ ...touchStart, distance })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isPinching && e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY)
      const scaleChange = distance / touchStart.distance
      setScale(Math.min(Math.max(scale * scaleChange, 0.5), 4))
    }
    if (isDragging && e.touches.length === 1 && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - touchStart.x,
        y: e.touches[0].clientY - touchStart.y
      })
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    setIsPinching(false)
  }

  // Navegación con teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') imagenSiguiente()
      if (e.key === 'ArrowLeft') imagenAnterior()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex])

  return (
    <div 
      className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center"
      onClick={() => {
        if (scale === 1) onClose()
      }}
    >
      {/* Contenedor de imagen con zoom */}
      <div 
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imageRef}
          src={images[currentIndex]}
          alt={`Imagen ${currentIndex + 1}`}
          className="select-none transition-transform duration-200 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: scale > 1 ? 'grab' : 'default',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
          draggable={false}
        />
      </div>

      {/* Controles superiores */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-6 h-6" />
          </button>
          <span className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            aria-label="Acercar"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            aria-label="Alejar"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={handleReset}
            className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            aria-label="Restablecer zoom"
          >
            <RotateCw className="w-5 h-5" />
          </button>
          <span className="text-white text-xs bg-black/50 px-2 py-1 rounded-full">
            {Math.round(scale * 100)}%
          </span>
        </div>
      </div>

      {/* Controles de navegación */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); imagenAnterior() }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); imagenSiguiente() }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </>
      )}

      {/* Indicador de zoom */}
      {scale > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full z-10">
          Arrastra para mover • Rueda para zoom
        </div>
      )}
    </div>
  )
}