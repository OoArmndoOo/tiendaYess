// app/(dashboard)/dashboard/crear-producto/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { X, Plus, Upload } from 'lucide-react'

export default function CrearProductoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [tipos, setTipos] = useState<any[]>([])
  const [usuarioId, setUsuarioId] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    nombre_producto: '',
    cantidad: '',
    precio: '',
    id_tipo: '',
    detalles: '',
  })
  const [imagenes, setImagenes] = useState<File[]>([])
  const [imagenesPreview, setImagenesPreview] = useState<string[]>([])

  useEffect(() => {
    const cargarDatos = async () => {
      // Cargar tipos
      const { data: tiposData } = await supabase.from('tipos').select('*')
      setTipos(tiposData || [])

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: usuarioData } = await supabase
          .from('usuarios')
          .select('id_usuario')
          .eq('email', user.email)
          .single()
        if (usuarioData) {
          setUsuarioId(usuarioData.id_usuario)
        }
      }
    }
    cargarDatos()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleImagenes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const nuevosArchivos = Array.from(files)
    const total = imagenes.length + nuevosArchivos.length

    if (total > 5) {
      toast.error('Máximo 5 imágenes por producto')
      e.target.value = ''
      return
    }

    // Validar tamaño de cada imagen (máx 5MB)
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

  const eliminarImagen = (index: number) => {
    const nuevasImagenes = imagenes.filter((_, i) => i !== index)
    const nuevasPreviews = imagenesPreview.filter((_, i) => i !== index)
    setImagenes(nuevasImagenes)
    setImagenesPreview(nuevasPreviews)
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
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

      // 2. Verificar que el bucket existe
      const bucketExiste = await verificarBucket()
      if (!bucketExiste) {
        toast.error('Error: El bucket "productos" no existe en Supabase. Crea uno en Storage.')
        setLoading(false)
        return
      }

      // 3. Crear producto
      const { data: producto, error: productError } = await supabase
        .from('productos')
        .insert({
          nombre_producto: formData.nombre_producto.trim(),
          cantidad: parseInt(formData.cantidad) || 0,
          precio: parseFloat(formData.precio),
          id_tipo: parseInt(formData.id_tipo),
          detalles: formData.detalles?.trim() || '',
          estado: true
        })
        .select()
        .single()

      if (productError) {
        console.error('Error creando producto:', productError)
        throw new Error(productError.message)
      }

      // 4. Subir imágenes
      if (imagenes.length > 0) {
        const urls = []
        let erroresSubida = 0

        for (const imagen of imagenes) {
          const fileName = `${producto.id_producto}/${Date.now()}_${imagen.name.replace(/\s/g, '_')}`
          
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

        // Guardar URLs en la tabla fotos
        if (urls.length > 0) {
          const { error: fotosError } = await supabase
            .from('fotos')
            .insert(urls.map(url => ({ id_producto: producto.id_producto, foto: url })))

          if (fotosError) {
            console.error('Error guardando fotos:', fotosError)
            toast.warning('Producto creado, pero hubo errores al guardar algunas imágenes')
          }
        }

        if (erroresSubida > 0 && urls.length === 0) {
          toast.warning('Producto creado, pero no se pudieron subir las imágenes')
        } else if (erroresSubida > 0) {
          toast.warning(`Producto creado con ${urls.length} imágenes. ${erroresSubida} imagen(es) fallaron.`)
        }
      }

      // 5. Registrar movimiento en la tabla registros
      if (usuarioId) {
        const detalleRegistro = `Creación del producto: ${producto.nombre_producto} (${producto.cantidad} unidades, Bs ${producto.precio.toFixed(2)})`
        
        await supabase
          .from('registros')
          .insert({
            id_usuario: usuarioId,
            id_producto: producto.id_producto,
            detalle_registro: detalleRegistro
          })
      }

      toast.success('✅ Producto creado exitosamente')
      
      // Limpiar formulario
      setFormData({
        nombre_producto: '',
        cantidad: '',
        precio: '',
        id_tipo: '',
        detalles: '',
      })
      setImagenes([])
      setImagenesPreview([])
      
      // Redirigir al inventario después de 1.5 segundos
      setTimeout(() => {
        router.push('/dashboard/inventario')
        router.refresh()
      }, 1500)

    } catch (error) {
      console.error('Error general:', error)
      toast.error(error instanceof Error ? error.message : 'Error al crear producto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Crear Producto</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Producto <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nombre_producto"
            value={formData.nombre_producto}
            onChange={handleChange}
            placeholder="Ej: Camisa de Algodón"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              placeholder="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              ⚠️ No hay categorías creadas. Crea una en "Crear Tipo" primero.
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
            placeholder="Descripción del producto, materiales, medidas, etc."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Imágenes <span className="text-xs text-gray-400">(máx 5, 5MB cada una)</span>
          </label>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImagenes}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={imagenes.length >= 5}
            />
            <div className={`
              w-full px-4 py-8 border-2 border-dashed rounded-lg text-center transition-colors
              ${imagenes.length >= 5 
                ? 'border-gray-200 bg-gray-50 text-gray-400' 
                : 'border-gray-300 hover:border-primary-500 hover:bg-primary-50/20 text-gray-500'
              }
            `}>
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">
                {imagenes.length >= 5 
                  ? 'Máximo 5 imágenes alcanzado' 
                  : 'Arrastra o haz clic para subir imágenes'
                }
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {imagenes.length}/5 imágenes seleccionadas
              </p>
            </div>
          </div>

          {imagenesPreview.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-3">
              {imagenesPreview.map((preview, index) => (
                <div key={index} className="relative w-20 h-20 group">
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`} 
                    className="w-full h-full object-cover rounded-lg border-2 border-gray-200 group-hover:border-primary-500 transition-colors" 
                  />
                  <button
                    type="button"
                    onClick={() => eliminarImagen(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-500 text-white py-2.5 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creando producto...
            </>
          ) : (
            'Crear Producto'
          )}
        </button>
      </form>
    </div>
  )
}