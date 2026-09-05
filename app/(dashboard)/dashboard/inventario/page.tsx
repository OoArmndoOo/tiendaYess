// app/(dashboard)/dashboard/inventario/page.tsx
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { 
  Package, 
  Edit, 
  Eye, 
  EyeOff, 
  Search, 
  Trash2, 
  Filter, 
  AlertCircle,
  RefreshCw,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registrarMovimiento } from '@/lib/actions/registros'
import EditarProductoModal from '@/components/modals/EditarProductoModal'

interface Producto {
  id_producto: number
  nombre_producto: string
  cantidad: number
  precio: number
  estado: boolean
  tipos: { nombre_tipo: string } | null
  fotos: { foto: string }[] | null
}

interface ProductoEliminar {
  id: number
  nombre: string
}

export default function InventarioPage() {
  const router = useRouter()
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activo' | 'inactivo'>('todos')
  const [productoEliminar, setProductoEliminar] = useState<ProductoEliminar | null>(null)
  const [productoEditando, setProductoEditando] = useState<number | null>(null)
  const [accionEnProceso, setAccionEnProceso] = useState<number | null>(null)
  const [tipos, setTipos] = useState<{ id_tipo: number; nombre_tipo: string }[]>([])

  // ========== CARGAR DATOS ==========
  const cargarDatos = useCallback(async () => {
    setLoading(true)
    try {
      // Cargar tipos
      const { data: tiposData } = await supabase
        .from('tipos')
        .select('id_tipo, nombre_tipo')
        .order('nombre_tipo')
      setTipos(tiposData || [])

      // Cargar productos con relaciones
      const { data: productosData, error } = await supabase
        .from('productos')
        .select(`
          id_producto,
          nombre_producto,
          cantidad,
          precio,
          estado,
          tipos (nombre_tipo),
          fotos (foto)
        `)
        .order('id_producto', { ascending: false })

      if (error) throw error
      setProductos(productosData || [])
    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error al cargar el inventario')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  // ========== FILTROS ==========
  const productosFiltrados = useMemo(() => {
    let filtrados = productos

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      filtrados = filtrados.filter(p => 
        p.nombre_producto.toLowerCase().includes(term)
      )
    }

    // Filtro por categoría
    if (filtroCategoria) {
      filtrados = filtrados.filter(p => 
        p.tipos?.nombre_tipo === filtroCategoria
      )
    }

    // Filtro por estado
    if (filtroEstado === 'activo') {
      filtrados = filtrados.filter(p => p.estado === true)
    } else if (filtroEstado === 'inactivo') {
      filtrados = filtrados.filter(p => p.estado === false)
    }

    return filtrados
  }, [productos, searchTerm, filtroCategoria, filtroEstado])

  // ========== ACCIONES ==========
  const handleToggleEstado = async (id: number, estadoActual: boolean, nombreProducto: string) => {
    if (accionEnProceso === id) return
    setAccionEnProceso(id)

    const nuevoEstado = !estadoActual
    const { error } = await supabase
      .from('productos')
      .update({ estado: nuevoEstado })
      .eq('id_producto', id)

    if (error) {
      toast.error('Error al cambiar estado')
      setAccionEnProceso(null)
      return
    }

    await registrarMovimiento(
      id,
      `Producto "${nombreProducto}" ${nuevoEstado ? 'activado' : 'desactivado'}`
    )

    toast.success(`✅ Producto ${nuevoEstado ? 'activado' : 'desactivado'}`)
    setAccionEnProceso(null)
    cargarDatos()
    router.refresh()
  }

  const handleEliminar = async (id: number, nombreProducto: string) => {
    if (accionEnProceso === id) return
    setAccionEnProceso(id)

    await registrarMovimiento(
      id,
      `Producto "${nombreProducto}" eliminado del inventario`
    )

    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id_producto', id)

    if (error) {
      toast.error('Error al eliminar producto')
      setAccionEnProceso(null)
      return
    }

    toast.success(`🗑️ Producto "${nombreProducto}" eliminado`)
    setProductoEliminar(null)
    setAccionEnProceso(null)
    cargarDatos()
    router.refresh()
  }

  const handleEditarExito = () => {
    setProductoEditando(null)
    cargarDatos()
    toast.success('✅ Producto actualizado correctamente')
  }

  const limpiarFiltros = () => {
    setSearchTerm('')
    setFiltroCategoria('')
    setFiltroEstado('todos')
  }

  // ========== UTILIDADES ==========
  const getStockStatus = (cantidad: number) => {
    if (cantidad === 0) return { label: 'Agotado', className: 'bg-red-100 text-red-700' }
    if (cantidad <= 5) return { label: 'Stock bajo', className: 'bg-yellow-100 text-yellow-700' }
    return { label: 'En stock', className: 'bg-green-100 text-green-700' }
  }

  // ========== RENDER ==========
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📦 Inventario</h2>
          <p className="text-sm text-gray-500">
            {productosFiltrados.length} {productosFiltrados.length === 1 ? 'producto' : 'productos'} encontrados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={cargarDatos}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Actualizar"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link 
            href="/dashboard/crear-producto"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todas las categorías</option>
            {tipos.map((tipo) => (
              <option key={tipo.id_tipo} value={tipo.nombre_tipo}>
                {tipo.nombre_tipo}
              </option>
            ))}
          </select>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as any)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">🟢 Activos</option>
            <option value="inactivo">🔴 Inactivos</option>
          </select>

          <button
            onClick={limpiarFiltros}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Filter className="w-4 h-4" />
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Lista de productos */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
          <p className="text-gray-500 mt-3">Cargando productos...</p>
        </div>
      ) : productosFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {productosFiltrados.map((producto) => {
            const stockStatus = getStockStatus(producto.cantidad)
            const imagenPrincipal = producto.fotos?.[0]?.foto || null

            return (
              <div 
                key={producto.id_producto} 
                className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200"
              >
                {/* Imagen */}
                <div className="relative h-44 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {imagenPrincipal ? (
                    <img 
                      src={imagenPrincipal} 
                      alt={producto.nombre_producto} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  ) : (
                    <Package className="w-14 h-14 text-gray-300" />
                  )}
                  
                  {/* Badge de estado en la imagen */}
                  {!producto.estado && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-bold px-4 py-1.5 bg-red-500/90 rounded-lg text-sm uppercase tracking-wider">
                        Inactivo
                      </span>
                    </div>
                  )}
                  
                  {/* Badge de stock bajo */}
                  {producto.estado && producto.cantidad <= 5 && producto.cantidad > 0 && (
                    <div className="absolute top-2 right-2">
                      <span className="flex items-center gap-1 px-2 py-1 bg-yellow-500/90 text-white text-xs font-semibold rounded-full">
                        <AlertCircle className="w-3 h-3" />
                        Stock bajo
                      </span>
                    </div>
                  )}
                  {producto.estado && producto.cantidad === 0 && (
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-1 bg-red-500/90 text-white text-xs font-semibold rounded-full">
                        Agotado
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-800 truncate flex-1" title={producto.nombre_producto}>
                      {producto.nombre_producto}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${
                      producto.estado 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {producto.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-0.5">
                    {producto.tipos?.nombre_tipo || 'Sin categoría'}
                  </p>
                  
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xl font-bold text-primary-600">
                      Bs {producto.precio?.toFixed(2) || '0.00'}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${stockStatus.className}`}>
                      {stockStatus.label}: {producto.cantidad || 0}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setProductoEditando(producto.id_producto)}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Editar producto"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleEstado(producto.id_producto, producto.estado, producto.nombre_producto)}
                      disabled={accionEnProceso === producto.id_producto}
                      className={`p-1.5 rounded-lg transition-colors ${
                        accionEnProceso === producto.id_producto
                          ? 'opacity-50 cursor-not-allowed'
                          : producto.estado 
                            ? 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50' 
                            : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                      }`}
                      title={producto.estado ? 'Desactivar' : 'Activar'}
                    >
                      {accionEnProceso === producto.id_producto ? (
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : producto.estado ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => setProductoEliminar({ id: producto.id_producto, nombre: producto.nombre_producto })}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            {searchTerm || filtroCategoria || filtroEstado !== 'todos' 
              ? 'No hay productos que coincidan con los filtros'
              : 'No hay productos en el inventario'}
          </p>
          {(searchTerm || filtroCategoria || filtroEstado !== 'todos') && (
            <button
              onClick={limpiarFiltros}
              className="text-primary-500 hover:underline text-sm mt-2"
            >
              Limpiar filtros
            </button>
          )}
          {!searchTerm && !filtroCategoria && filtroEstado === 'todos' && (
            <Link 
              href="/dashboard/crear-producto"
              className="inline-block mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm"
            >
              + Crear primer producto
            </Link>
          )}
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {productoEliminar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">¿Eliminar producto?</h3>
                <p className="text-gray-500 mt-1">
                  ¿Estás seguro de que quieres eliminar <strong className="text-gray-700">"{productoEliminar.nombre}"</strong>?
                </p>
                <p className="text-sm text-red-500 mt-1">⚠️ Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setProductoEliminar(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminar(productoEliminar.id, productoEliminar.nombre)}
                disabled={accionEnProceso === productoEliminar.id}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {accionEnProceso === productoEliminar.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Eliminando...
                  </>
                ) : (
                  'Eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {productoEditando && (
        <EditarProductoModal
          productoId={productoEditando}
          isOpen={true}
          onClose={() => setProductoEditando(null)}
          onSuccess={handleEditarExito}
        />
      )}
    </div>
  )
}