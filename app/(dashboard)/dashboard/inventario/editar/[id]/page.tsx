// app/(dashboard)/dashboard/inventario/editar/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { X, Upload, Trash2, Save, ArrowLeft, AlertCircle } from 'lucide-react'
import { registrarMovimiento } from '@/lib/actions/registros'

interface ProductoData {
  id_producto: number
  nombre_producto: string
  cantidad: number
  precio: number
  id_tipo: number
  detalles: string
  estado: boolean
}

export default function EditarProductoPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [cargandoDatos, setCargandoDatos] = useState(true)
  const [tipos, setTipos] = useState<any[]>([])
  const [producto, setProducto] = useState<ProductoData | null>(null)
  const [fotosExistentes, setFotosExistentes] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

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

  // ============ VERIFICAR BUCKET ============
  const verificarBucket = async () => {
    try {
      const { error } = await supabase.storage
        .from('productos')
        .list('', { limit: 1 })
      
      if (error) {
        console.error('Error verificando bucket:', error)
        return false
      }
      return true
    } catch (error) {
      console.error('Error verificando bucket:', error)
      return false
    }
  }

  // ============ CARGAR DATOS ============
  const cargarDatos = async () => {
    setCargandoDatos(true)
    setError(null)
    
    try {
      const productoId = parseInt(params.id)
      
      // Validar que el ID sea un número válido
      if (isNaN(productoId) || productoId <= 0) {
        setError('ID de producto inválido')
        toast.error('ID de producto inválido')
        setTimeout(() => router.push('/dashboard/inventario'), 2000)
        return
      }

      // Cargar tipos
      const { data: tiposData, error: tiposError } = await supabase
        .from('tipos')
        .select('*')
        .order('nombre_tipo')
      
      if (tiposError) {
        console.error('Error cargando tipos:', tiposError)
        toast.warning('Error al cargar categorías, pero continuando...')
      }
      setTipos(tiposData || [])

      // Cargar producto
      const { data: productoData, error: productError } = await supabase
        .from('productos')
        .select('*')
        .eq('id_producto', productoId)
        .single()

      if (productError) {
        console.error('Error cargando producto:', productError)
        setError('Producto no encontrado')
        toast.error('Producto no encontrado')
        setTimeout(() => router.push('/dashboard/inventario'), 2000)
        return
      }

      if (!productoData) {
        setError('Producto no encontrado')
        toast.error('Producto no encontrado')
        setTimeout(() => router.push('/dashboard/inventario'), 2000)
        return
      }

      setProducto(productoData)
      setFormData({
        nombre_producto: productoData.nombre_producto || '',
        cantidad: productoData.cantidad?.toString() || '0',
        precio: productoData.precio?.toString() || '0',
        id_tipo: productoData.id_tipo?.toString() || '',
        detalles: productoData.detalles || '',
      })

      // Cargar fotos existentes
      const { data: fotosData, error: fotosError } = await supabase
        .from('fotos')
        .select('*')
        .eq('id_producto', productoId)
        .order('id_foto')

      if (fotosError) {
        console.error('Error cargando fotos:', fotosError)
        toast.warning('Error al cargar las imágenes')
      }
      setFotosExistentes(fotosData || [])

    } catch (error) {
      console.error('Error en cargarDatos:', error)
      setError('Error al cargar el producto')
      toast.error('Error al cargar el producto')
      setTimeout(() => router.push('/dashboard/inventario'), 2000)
    } finally {
      setCargandoDatos(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [params.id])

  // ============ MANEJADORES ============
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
      if (!file.type.startsWith('image/')) {
        toast.error(`El archivo ${file.name} no es una imagen válida`)
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
    const nuevasImagenes = imagenes.filter((_, i) => i !== index)
    const nuevasPreviews = imagenesPreview.filter((_, i) => i !== index)
    setImagenes(nuevasImagenes)
    setImagenesPreview(nuevasPreviews)
  }

  const eliminarFotoExistente = (idFoto: number) => {
    setImagenesEliminar([...imagenesEliminar, idFoto])
    setFotosExistentes(fotosExistentes.filter(f => f.id_foto !== idFoto))
    toast.info('Imagen marcada para eliminar')
  }

  // ============ ENVIAR FORMULARIO ============
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const productoId = parseInt(params.id)

      // 1. Validar datos
      if (!formData.nombre_producto.trim()) {
        toast.error('El nombre del producto es requerido')
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

      // 2. Verificar que el bucket existe (si hay imágenes nuevas)
      if (imagenes.length > 0) {
        const bucketExiste = await verificarBucket()
        if (!bucketExiste) {
          toast.error('Error: El bucket "productos" no existe en Supabase.')
          setLoading(false)
          return
        }
      }

      // 3. Obtener nombre anterior para el registro
      const nombreAnterior = producto?.nombre_producto || formData.nombre_producto

      // 4. Actualizar producto
      const { error: productError } = await supabase
        .from('productos')
        .update({
          nombre_producto: formData.nombre_producto.trim(),
          cantidad: parseInt(formData.cantidad) || 0,
          precio: parseFloat(formData.precio),
          id_tipo: parseInt(formData.id_tipo),
          detalles: formData.detalles?.trim() || '',
        })
        .eq('id_producto', productoId)

      if (productError) throw new Error(productError.message)

      // 5. Registrar movimiento
      const detalleMovimiento = `Edición del producto: ${nombreAnterior} → ${formData.nombre_producto} (${formData.cantidad} unidades, Bs ${formData.precio})`
      await registrarMovimiento(productoId, detalleMovimiento)

      // 6. Eliminar fotos marcadas
      if (imagenesEliminar.length > 0) {
        const { error: deleteError } = await supabase
          .from('fotos')
          .delete()
          .in('id_foto', imagenesEliminar)

        if (deleteError) {
          console.error('Error eliminando fotos:', deleteError)
          toast.warning('Error al eliminar algunas imágenes')
        }
      }

      // 7. Subir nuevas imágenes
      if (imagenes.length > 0) {
        const urls = []
        let erroresSubida = 0

        for (const imagen of imagenes) {
          const fileName = `${productoId}/${Date.now()}_${imagen.name.replace(/\s/g, '_')}`
          
          try {
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('productos')
              .upload(fileName, imagen, {
                cacheControl: '3600',
                upsert: false
              })

            if (uploadError) {
              console.error('Error subiendo imagen:', uploadError)
              erroresSubida++
              continue
            }

            const { data: { publicUrl } } = supabase.storage
              .from('productos')
              .getPublicUrl(fileName)

            urls.push(publicUrl)
          } catch (error) {
            console.error('Error en subida:', error)
            erroresSubida++
          }
        }

        if (urls.length > 0) {
          const { error: insertError } = await supabase
            .from('fotos')
            .insert(urls.map(url => ({ id_producto: productoId, foto: url })))

          if (insertError) {
            console.error('Error guardando fotos:', insertError)
            toast.warning('Producto actualizado, pero hubo errores al guardar algunas imágenes')
          }
        }

        if (erroresSubida > 0 && urls.length === 0) {
          toast.warning('Producto actualizado, pero no se pudieron subir las imágenes')
        } else if (erroresSubida > 0) {
          toast.warning(`Producto actualizado con ${urls.length} imágenes. ${erroresSubida} imagen(es) fallaron.`)
        }
      }

      toast.success('✅ Producto actualizado exitosamente')
      
      // Redirigir al inventario después de 1.5 segundos
      setTimeout(() => {
        router.push('/dashboard/inventario')
        router.refresh()
      }, 1500)

    } catch (error) {
      console.error('Error:', error)
      toast.error(error instanceof Error ? error.message : 'Error al actualizar producto')
    } finally {
      setLoading(false)
    }
  }

  // ============ RENDER ============
  if (cargandoDatos) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
          <p className="text-gray-500 mt-4">Cargando producto...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Error</h3>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={() => router.push('/dashboard/inventario')}
            className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Volver al Inventario
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Botón volver */}
      <button
        onClick={() => router.push('/dashboard/inventario')}
        className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Volver al Inventario</span>
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-5">
          <h2 className="text-xl font-bold text-white">
            Editar Producto
          </h2>
          <p className="text-white/80 text-sm">
            Modifica los datos del producto #{producto?.id_producto}
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Producto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="nombre_producto"
              value={formData.nombre_producto}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              placeholder="Ej: Camisa de Algodón"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="0"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="0.00"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
              required
            >
              <option value="">Seleccionar categoría</option>
              {tipos.map((tipo) => (
                <option key={tipo.id_tipo} value={tipo.id_tipo}>
                  {tipo.nombre_tipo}
                </option>
              ))}
            </select>
            {tipos.length === 0 && (
              <p className="text-xs text-yellow-600 mt-1">
                ⚠️ No hay categorías disponibles. Crea una en "Crear Tipo".
              </p>
            )}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
              placeholder="Descripción del producto, materiales, medidas, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imágenes <span className="text-xs text-gray-400">(máx 5, 5MB cada una)</span>
            </label>

            {/* Fotos existentes */}
            {fotosExistentes.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2">Imágenes actuales:</p>
                <div className="flex flex-wrap gap-3">
                  {fotosExistentes.map((foto) => (
                    <div key={foto.id_foto} className="relative w-20 h-20 group">
                      <img
                        src={foto.foto}
                        alt="Producto"
                        className="w-full h-full object-cover rounded-lg border-2 border-gray-200 group-hover:border-primary-300 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => eliminarFotoExistente(foto.id_foto)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow-md"
                        title="Eliminar imagen"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                        {fotosExistentes.indexOf(foto) + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input para subir nuevas imágenes */}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagenes}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={fotosExistentes.length + imagenes.length >= 5}
              />
              <div className={`
                w-full px-4 py-6 border-2 border-dashed rounded-lg text-center transition-colors
                ${fotosExistentes.length + imagenes.length >= 5 
                  ? 'border-gray-200 bg-gray-50 text-gray-400' 
                  : 'border-gray-300 hover:border-primary-500 hover:bg-primary-50/20 text-gray-500'
                }
              `}>
                <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">
                  {fotosExistentes.length + imagenes.length >= 5 
                    ? 'Máximo 5 imágenes alcanzado' 
                    : 'Arrastra o haz clic para subir imágenes'
                  }
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {fotosExistentes.length + imagenes.length}/5 imágenes
                </p>
              </div>
            </div>

            {/* Previews de nuevas imágenes */}
            {imagenesPreview.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {imagenesPreview.map((preview, index) => (
                  <div key={index} className="relative w-20 h-20 group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg border-2 border-primary-200 group-hover:border-primary-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => eliminarImagenNueva(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow-md"
                      title="Eliminar imagen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-primary-600/80 text-white text-[10px] px-1.5 py-0.5 rounded">
                      nueva
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-2">
              💡 Las imágenes nuevas se añadirán a las existentes. Marca la "X" en una imagen existente para eliminarla.
            </p>
          </div>

          {/* Estado actual del producto */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estado actual:</span>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${producto?.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {producto?.estado ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push('/dashboard/inventario')}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-500 text-white py-2.5 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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
          </div>
        </form>
      </div>
    </div>
  )
}