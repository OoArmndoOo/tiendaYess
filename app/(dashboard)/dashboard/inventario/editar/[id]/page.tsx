// app/(dashboard)/dashboard/inventario/editar/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { X, Upload, Trash2 } from 'lucide-react'
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
        setCargandoDatos(true)
        try {
            // Cargar tipos
            const { data: tiposData } = await supabase.from('tipos').select('*')
            setTipos(tiposData || [])

            // Cargar producto
            const { data: productoData, error } = await supabase
                .from('productos')
                .select('*')
                .eq('id_producto', parseInt(params.id))
                .single()

            if (error) throw error
            setProducto(productoData)
            setFormData({
                nombre_producto: productoData.nombre_producto,
                cantidad: productoData.cantidad.toString(),
                precio: productoData.precio.toString(),
                id_tipo: productoData.id_tipo.toString(),
                detalles: productoData.detalles || '',
            })

            // Cargar fotos existentes
            const { data: fotosData } = await supabase
                .from('fotos')
                .select('*')
                .eq('id_producto', parseInt(params.id))
            setFotosExistentes(fotosData || [])

        } catch (error) {
            console.error('Error cargando datos:', error)
            toast.error('Error al cargar el producto')
            router.push('/dashboard/inventario')
        } finally {
            setCargandoDatos(false)
        }
    }

    useEffect(() => {
        cargarDatos()
    }, [params.id])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleImagenes = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const nuevasImagenes = Array.from(files)
        const total = imagenes.length + nuevasImagenes.length
        const totalFotos = fotosExistentes.length - imagenesEliminar.length + nuevasImagenes.length

        if (totalFotos > 5) {
            toast.error('Máximo 5 imágenes por producto')
            e.target.value = ''
            return
        }

        const archivosValidos = nuevasImagenes.filter(file => {
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

    const eliminarFotoExistente = (idFoto: number) => {
        setImagenesEliminar([...imagenesEliminar, idFoto])
        setFotosExistentes(fotosExistentes.filter(f => f.id_foto !== idFoto))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // 1. Validar datos
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

            // 2. Actualizar producto
            const { error: productError } = await supabase
                .from('productos')
                .update({
                    nombre_producto: formData.nombre_producto.trim(),
                    cantidad: parseInt(formData.cantidad) || 0,
                    precio: parseFloat(formData.precio),
                    id_tipo: parseInt(formData.id_tipo),
                    detalles: formData.detalles?.trim() || '',
                })
                .eq('id_producto', parseInt(params.id))

            if (productError) throw new Error(productError.message)

            await registrarMovimiento(
                parseInt(params.id),
                `Edición del producto: ${formData.nombre_producto} (${formData.cantidad} unidades, Bs ${formData.precio})`
            )
            // 3. Eliminar fotos marcadas
            if (imagenesEliminar.length > 0) {
                await supabase
                    .from('fotos')
                    .delete()
                    .in('id_foto', imagenesEliminar)
            }

            // 4. Subir nuevas imágenes
            if (imagenes.length > 0) {
                const urls = []
                for (const imagen of imagenes) {
                    const fileName = `${params.id}/${Date.now()}_${imagen.name.replace(/\s/g, '_')}`
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
                        .insert(urls.map(url => ({ id_producto: parseInt(params.id), foto: url })))
                }
            }

            toast.success('✅ Producto actualizado exitosamente')
            router.push('/dashboard/inventario')
            router.refresh()

        } catch (error) {
            console.error('Error:', error)
            toast.error(error instanceof Error ? error.message : 'Error al actualizar producto')
        } finally {
            setLoading(false)
        }
    }

    if (cargandoDatos) {
        return (
            <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
                <p className="text-gray-500 mt-2">Cargando producto...</p>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Editar Producto</h2>

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

                    {/* Nuevas imágenes */}
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
                                        onClick={() => eliminarImagen(index)}
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
                    className="w-full bg-primary-500 text-white py-2.5 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Actualizando...' : 'Actualizar Producto'}
                </button>
            </form>
        </div>
    )
}