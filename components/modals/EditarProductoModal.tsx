// components/modals/EditarProductoModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { X, Upload, Trash2, Save } from 'lucide-react'

// ============================================================
// INTERFAZ PARA LOS DATOS DEL PRODUCTO
// ============================================================
interface ProductoData {
  id_producto: number
  nombre_producto: string
  cantidad: number
  precio: number
  id_tipo: number
  detalles: string
  estado: boolean
  fecha_creacion: string
  ultima_modificacion: string
}

interface EditarProductoModalProps {
  productoId: number
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditarProductoModal({ 
  productoId, 
  isOpen, 
  onClose, 
  onSuccess 
}: EditarProductoModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [cargandoDatos, setCargandoDatos] = useState(true)
  const [tipos, setTipos] = useState<any[]>([])
  const [producto, setProducto] = useState<ProductoData | null>(null)
  const [fotosExistentes, setFotosExistentes] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    nombre_producto: '',
    cantidad: '',
    precio: '',
    id_tipo: '',
    detalles: '',
  })
  const [imagenes, setImagenes] = useState<File[]>([])
  const [imagenesPreview, setImagenesPreview] = useState<string[]>([])
  const [imagenesEliminar, setImagenesEliminar] = useState<number[]>([])

  const cargarDatos = async () => {
    if (!productoId) return
    
    setCargandoDatos(true)
    try {
      // Cargar tipos
      const { data: tiposData } = await supabase.from('tipos').select('*')
      setTipos(tiposData || [])

      // Cargar producto con tipado
      const { data: productoData, error } = await supabase
        .from('productos')
        .select('*')
        .eq('id_producto', productoId)
        .single() as any

      if (error) throw error

      const producto = productoData as ProductoData
      setProducto(producto)
      setFormData({
        nombre_producto: producto.nombre_producto || '',
        cantidad: producto.cantidad?.toString() || '0',
        precio: producto.precio?.toString() || '0',
        id_tipo: producto.id_tipo?.toString() || '',
        detalles: producto.detalles || '',
      })

      // Cargar fotos existentes
      const { data: fotosData } = await supabase
        .from('fotos')
        .select('*')
        .eq('id_producto', productoId)
      setFotosExistentes(fotosData || [])

    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error al cargar el producto')
    } finally {
      setCargandoDatos(false)
    }
  }

  useEffect(() => {
    if (isOpen && productoId) {
      cargarDatos()
    }
  }, [isOpen, productoId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleImagenes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const nuevosArchivos = Array.from(files)
    const totalFotos = fotosExistentes.length - imagenesEliminar.length + imagenes.length + nuevosArchivos.length

    if (totalFotos > 5) {
      toast.error('Máximo 5 imágenes por producto')
      e.target.value = ''
      return
    }

    const archivosValidos = nuevosArchivos.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`La imagen ${file.name} supera los 5MB`)
        return false
      }
      return true
    })

    if (archivosValidos.length === 0) {
      e.target.value = ''
      return
    }

    setImagenes([...imagenes, ...archivosValidos])
    const previews = archivosValidos.map(file => URL.createObjectURL(file))
    setImagenesPreview([...imagenesPreview, ...previews])
    e.target.value = ''
  }

  const eliminarImagenNueva = (index: number) => {
    setImagenes(imagenes.filter((_, i) => i !== index))
    setImagenesPreview(imagenesPreview.filter((_, i) => i !== index))
  }

  const eliminarFotoExistente = (idFoto: number) => {
    setImagenesEliminar([...imagenesEliminar, idFoto])
    setFotosExistentes(fotosExistentes.filter(f => f.id_foto !== idFoto))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar datos
      if (!formData.nombre_producto.trim()) {
        toast.error('El nombre es requerido')
        setLoading(false)
        return
      }
      if (!formData.id_tipo) {
        toast.error('Selecciona una categoría')
        setLoading(false)
        return
      }
      if (!formData.precio || parseFloat(formData.precio) <= 0) {
        toast.error('El precio debe ser mayor a 0')
        setLoading(false)
        return
      }

      // 1. Actualizar producto
      const { error: productError } = await supabase
        .from('productos')
        .update({
          nombre_producto: formData.nombre_producto.trim(),
          cantidad: parseInt(formData.cantidad) || 0,
          precio: parseFloat(formData.precio),
          id_tipo: parseInt(formData.id_tipo),
          detalles: formData.detalles?.trim() || '',
        })
        .eq('id_producto', productoId) as any

      if (productError) throw new Error(productError.message)

      // 2. Eliminar fotos marcadas
      if (imagenesEliminar.length > 0) {
        await supabase
          .from('fotos')
          .delete()
          .in('id_foto', imagenesEliminar) as any
      }

      // 3. Subir nuevas imágenes
      if (imagenes.length > 0) {
        const urls = []
        for (const imagen of imagenes) {
          const fileName = `${productoId}/${Date.now()}_${imagen.name.replace(/\s/g, '_')}`
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('productos')
            .upload(fileName, imagen, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            console.error('Error subiendo imagen:', uploadError)
            continue
          }

          const { data: { publicUrl } } = supabase.storage
            .from('productos')
            .getPublicUrl(fileName)

          urls.push(publicUrl)
        }

        if (urls.length > 0) {
          await supabase
            .from('fotos')
            .insert(urls.map(url => ({ id_producto: productoId, foto: url }))) as any
        }
      }

      toast.success('✅ Producto actualizado exitosamente')
      onSuccess()
      onClose()
      router.refresh()

    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar producto')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Editar Producto</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cargandoDatos ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
            <p className="text-gray-500 mt-2">Cargando producto...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Producto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nombre_producto"
                value={formData.nombre_producto}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio (Bs) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="precio"
                  value={formData.precio}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                name="id_tipo"
                value={formData.id_tipo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Seleccionar categoría</option>
                {tipos.map((tipo) => (
                  <option key={tipo.id_tipo} value={tipo.id_tipo}>
                    {tipo.nombre_tipo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Detalles
              </label>
              <textarea
                name="detalles"
                value={formData.detalles}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imágenes (máx 5)
              </label>

              {/* Fotos existentes */}
              {fotosExistentes.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-3">
                  {fotosExistentes.map((foto) => (
                    <div key={foto.id_foto} className="relative w-20 h-20 group">
                      <img 
                        src={foto.foto} 
                        alt="Producto" 
                        className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => eliminarFotoExistente(foto.id_foto)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Input para subir nuevas imágenes */}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagenes}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={fotosExistentes.length + imagenes.length >= 5}
              />
              <p className="text-xs text-gray-400 mt-1">
                {fotosExistentes.length + imagenes.length}/5 imágenes
              </p>

              {/* Previews de nuevas imágenes */}
              {imagenesPreview.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {imagenesPreview.map((preview, index) => (
                    <div key={index} className="relative w-20 h-20">
                      <img 
                        src={preview} 
                        alt={`Preview ${index}`} 
                        className="w-full h-full object-cover rounded-lg border-2 border-primary-200" 
                      />
                      <button
                        type="button"
                        onClick={() => eliminarImagenNueva(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 text-white py-2.5 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Actualizar Producto</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}