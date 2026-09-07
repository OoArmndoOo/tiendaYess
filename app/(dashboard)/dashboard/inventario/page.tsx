// app/(dashboard)/dashboard/inventario/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
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
  Plus,
  Image as ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registrarMovimiento } from '@/lib/actions/registros'
import EditarProductoModal from '@/components/modals/EditarProductoModal'
import DetalleProductoModal from '@/components/modals/DetalleProductoModal'

// ============================================================
// INTERFACES
// ============================================================
interface Producto {
  id_producto: number
  nombre_producto: string
  cantidad: number
  precio: number
  estado: boolean
  id_tipo: number | null          // <-- NUEVO: necesario para filtrar en SQL
  tipos: { nombre_tipo: string } | null
  fotos: { foto: string }[] | null
}

interface ProductoEliminar {
  id: number
  nombre: string
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
const ITEMS_PER_PAGE = 20 // Productos por página

export default function InventarioPage() {
  const router = useRouter()

  // Estados de datos
  const [productos, setProductos] = useState<Producto[]>([])
  const [tipos, setTipos] = useState<{ id_tipo: number; nombre_tipo: string }[]>([])
  const [loading, setLoading] = useState(true)

  // Estados de paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const [totalProductos, setTotalProductos] = useState(0)
  const totalPaginas = Math.ceil(totalProductos / ITEMS_PER_PAGE)

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activo' | 'inactivo'>('todos')

  // Estados de modales y acciones
  const [productoEliminar, setProductoEliminar] = useState<ProductoEliminar | null>(null)
  const [productoEditando, setProductoEditando] = useState<number | null>(null)
  const [productoDetalle, setProductoDetalle] = useState<number | null>(null)
  const [accionEnProceso, setAccionEnProceso] = useState<number | null>(null)

  // ============================================================
  // CARGA DE DATOS (CON PAGINACIÓN Y FILTROS EN SQL)
  // ============================================================
  const cargarDatos = useCallback(async (page: number = paginaActual) => {
    setLoading(true)
    try {
      // 1. Cargar tipos (se cachean en el estado, se cargan una sola vez)
      if (tipos.length === 0) {
        const { data: tiposData } = await supabase
          .from('tipos')
          .select('id_tipo, nombre_tipo')
          .order('nombre_tipo')
        if (tiposData) setTipos(tiposData)
      }

      // 2. Construir la consulta base (con conteo exacto para paginación)
      let query = supabase
        .from('productos')
        .select(
          `
          id_producto,
          nombre_producto,
          cantidad,
          precio,
          estado,
          id_tipo,
          tipos (nombre_tipo),
          fotos (foto)
        `,
          { count: 'exact' }
        )
        .order('id_producto', { ascending: false })

      // 3. Aplicar filtros (BÚSQUEDA)
      if (searchTerm.trim()) {
        query = query.ilike('nombre_producto', `%${searchTerm.trim()}%`)
      }

      // 4. Aplicar filtros (CATEGORÍA)
      if (filtroCategoria) {
        const tipoSeleccionado = tipos.find((t) => t.nombre_tipo === filtroCategoria)
        if (tipoSeleccionado) {
          query = query.eq('id_tipo', tipoSeleccionado.id_tipo)
        }
      }

      // 5. Aplicar filtros (ESTADO)
      if (filtroEstado === 'activo') {
        query = query.eq('estado', true)
      } else if (filtroEstado === 'inactivo') {
        query = query.eq('estado', false)
      }

      // 6. Aplicar PAGINACIÓN
      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      query = query.range(from, to)

      // 7. Ejecutar consulta
      const { data: productosData, error, count } = await query

      if (error) throw error

      setProductos(productosData || [])
      setTotalProductos(count || 0)

      // Si la página actual es mayor que el total de páginas (ej: se eliminaron productos), ajustar
      const maxPage = Math.ceil((count || 0) / ITEMS_PER_PAGE)
      if (page > maxPage && maxPage > 0) {
        setPaginaActual(maxPage)
      }
    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error al cargar el inventario')
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filtroCategoria, filtroEstado, tipos.length])

  // ============================================================
  // EFECTOS
  // ============================================================
  // Recargar cuando cambian los filtros o la página
  useEffect(() => {
    cargarDatos(paginaActual)
  }, [cargarDatos, paginaActual])

  // Resetear a la página 1 cuando cambian los filtros (búsqueda, categoría, estado)
  useEffect(() => {
    setPaginaActual(1)
  }, [searchTerm, filtroCategoria, filtroEstado])

  // ============================================================
  // ACCIONES (sin cambios en lógica, solo optimización de llamadas)
  // ============================================================
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
    // Recargar la página actual (respetando los filtros)
    cargarDatos(paginaActual)
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
    cargarDatos(paginaActual) // Recargar página actual
    router.refresh()
  }

  const handleEditarExito = () => {
    setProductoEditando(null)
    cargarDatos(paginaActual) // Recargar página actual
    toast.success('✅ Producto actualizado correctamente')
  }

  const limpiarFiltros = () => {
    setSearchTerm('')
    setFiltroCategoria('')
    setFiltroEstado('todos')
    setPaginaActual(1)
  }

  // ============================================================
  // UTILIDADES
  // ============================================================
  const getStockStatus = (cantidad: number) => {
    if (cantidad === 0) return { label: 'Agotado', className: 'bg-red-100 text-red-700' }
    if (cantidad <= 5) return { label: 'Stock bajo', className: 'bg-yellow-100 text-yellow-700' }
    return { label: 'En stock', className: 'bg-green-100 text-green-700' }
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div>
      {/* ====== HEADER ====== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📦 Inventario</h2>
          <p className="text-sm text-gray-500">
            {totalProductos} productos en total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => cargarDatos(paginaActual)}
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

      {/* ====== FILTROS ====== */}
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

      {/* ====== LISTA DE PRODUCTOS ====== */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary-500 border-t-transparent"></div>
          <p className="text-gray-500 mt-3">Cargando productos...</p>
        </div>
      ) : productos.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {productos.map((producto) => {
              const stockStatus = getStockStatus(producto.cantidad)
              const imagenPrincipal = producto.fotos?.[0]?.foto || null
              const totalFotos = producto.fotos?.length || 0

              return (
                <div
                  key={producto.id_producto}
                  className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer"
                  onClick={() => setProductoDetalle(producto.id_producto)}
                >
                  {/* ====== IMAGEN CON EFECTO BLUR ====== */}
                  <div className="relative h-52 w-full overflow-hidden bg-gray-100 flex-shrink-0">
                    {/* Fondo difuminado - opacidad 100% */}
                    {imagenPrincipal && (
                      <div
                        className="absolute inset-0 bg-cover bg-center blur-xl opacity-100"
                        style={{ backgroundImage: `url(${imagenPrincipal})` }}
                      />
                    )}

                    {/* Imagen principal con next/image (optimizada) */}
                    <div className="relative w-full h-full flex items-center justify-center">
                      {imagenPrincipal ? (
                        <Image
                          src={imagenPrincipal}
                          alt={producto.nombre_producto}
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          loading="lazy"
                          quality={75}
                        />
                      ) : (
                        <Package className="w-14 h-14 text-gray-300" />
                      )}
                    </div>

                    {/* Badge de estado en la imagen */}
                    {!producto.estado && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold px-4 py-1.5 bg-red-500/90 rounded-lg text-sm uppercase tracking-wider">
                          Inactivo
                        </span>
                      </div>
                    )}

                    {/* Badge de stock bajo en la esquina */}
                    {producto.estado && producto.cantidad <= 5 && producto.cantidad > 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="flex items-center gap-1 px-2.5 py-1 bg-yellow-500/90 text-white text-xs font-semibold rounded-full shadow-sm">
                          <AlertCircle className="w-3 h-3" />
                          Stock bajo
                        </span>
                      </div>
                    )}
                    {producto.estado && producto.cantidad === 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 bg-red-500/90 text-white text-xs font-semibold rounded-full shadow-sm">
                          Agotado
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

                  {/* ====== INFO DEL PRODUCTO ====== */}
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-gray-800 truncate flex-1" title={producto.nombre_producto}>
                        {producto.nombre_producto}
                      </h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
                          producto.estado
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
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

                    {/* ====== ACCIONES ====== */}
                    <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setProductoEditando(producto.id_producto)
                        }}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Editar producto"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleEstado(producto.id_producto, producto.estado, producto.nombre_producto)
                        }}
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
                        onClick={(e) => {
                          e.stopPropagation()
                          setProductoEliminar({ id: producto.id_producto, nombre: producto.nombre_producto })
                        }}
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

          {/* ====== PAGINACIÓN ====== */}
          {totalPaginas > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200 gap-4">
              <span className="text-sm text-gray-500 order-2 sm:order-1">
                Mostrando {((paginaActual - 1) * ITEMS_PER_PAGE) + 1} -{' '}
                {Math.min(paginaActual * ITEMS_PER_PAGE, totalProductos)} de {totalProductos} productos
              </span>
              <div className="flex items-center space-x-2 order-1 sm:order-2">
                <button
                  onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-3 py-1.5 text-sm text-gray-600 bg-gray-50 rounded-lg border border-gray-100">
                  {paginaActual} / {totalPaginas}
                </span>
                <button
                  onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
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

      {/* ====== MODALES ====== */}
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

      {productoEditando && (
        <EditarProductoModal
          productoId={productoEditando}
          isOpen={true}
          onClose={() => setProductoEditando(null)}
          onSuccess={handleEditarExito}
        />
      )}

      {productoDetalle && (
        <DetalleProductoModal
          productoId={productoDetalle}
          isOpen={true}
          onClose={() => setProductoDetalle(null)}
        />
      )}
    </div>
  )
}