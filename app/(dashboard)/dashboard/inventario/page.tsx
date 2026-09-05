// app/(dashboard)/dashboard/inventario/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Package, Edit, Eye, EyeOff, Search, Trash2, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registrarMovimiento } from '@/lib/actions/registros'

interface Producto {
  id_producto: number
  nombre_producto: string
  cantidad: number
  precio: number
  estado: boolean
  tipos: { nombre_tipo: string } | null
  fotos: { foto: string }[] | null
}

export default function InventarioPage() {
  const router = useRouter()
  const [productos, setProductos] = useState<Producto[]>([])
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([])
  const [tipos, setTipos] = useState<{ id_tipo: number; nombre_tipo: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activo' | 'inactivo'>('todos')
  const [productoEliminar, setProductoEliminar] = useState<number | null>(null)
  const [accionEnProceso, setAccionEnProceso] = useState<number | null>(null)

  const cargarDatos = async () => {
    setLoading(true)
    try {
      // Cargar tipos para el filtro
      const { data: tiposData } = await supabase
        .from('tipos')
        .select('id_tipo, nombre_tipo')
      setTipos(tiposData || [])

      // Cargar productos
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
      setProductosFiltrados(productosData || [])
    } catch (error) {
      console.error('Error cargando datos:', error)
      toast.error('Error al cargar el inventario')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    // Aplicar filtros
    let filtrados = productos

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      filtrados = filtrados.filter(p => 
        p.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase())
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

    setProductosFiltrados(filtrados)
  }, [searchTerm, filtroCategoria, filtroEstado, productos])

  const handleToggleEstado = async (id: number, estadoActual: boolean, nombreProducto: string) => {
    // Evitar múltiples clics
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

    // Registrar movimiento
    await registrarMovimiento(
      id,
      `Producto "${nombreProducto}" ${nuevoEstado ? 'activado' : 'desactivado'}`
    )

    toast.success(`Producto ${nuevoEstado ? 'activado' : 'desactivado'}`)
    setAccionEnProceso(null)
    cargarDatos()
    router.refresh()
  }

  const handleEliminar = async (id: number, nombreProducto: string) => {
    setAccionEnProceso(id)

    // Registrar movimiento antes de eliminar
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

    toast.success('Producto eliminado')
    setProductoEliminar(null)
    setAccionEnProceso(null)
    cargarDatos()
    router.refresh()
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Inventario</h2>
        <Link 
          href="/dashboard/crear-producto"
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm whitespace-nowrap"
        >
          + Nuevo Producto
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Búsqueda */}
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

          {/* Filtro por categoría */}
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

          {/* Filtro por estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as any)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="todos">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>

          {/* Limpiar filtros */}
          <button
            onClick={() => {
              setSearchTerm('')
              setFiltroCategoria('')
              setFiltroEstado('todos')
            }}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Contador de productos */}
      <div className="text-sm text-gray-500 mb-4">
        {productosFiltrados.length} {productosFiltrados.length === 1 ? 'producto' : 'productos'} encontrados
      </div>

      {/* Lista de productos */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
          <p className="text-gray-500 mt-2">Cargando productos...</p>
        </div>
      ) : productosFiltrados.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {productosFiltrados.map((producto: any) => (
            <div key={producto.id_producto} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Imagen */}
              <div className="h-40 bg-gray-100 flex items-center justify-center relative">
                {producto.fotos?.[0]?.foto ? (
                  <img 
                    src={producto.fotos[0].foto} 
                    alt={producto.nombre_producto} 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <Package className="w-12 h-12 text-gray-400" />
                )}
                {!producto.estado && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold px-3 py-1 bg-red-500/80 rounded-lg text-sm">
                      INACTIVO
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 truncate">{producto.nombre_producto}</h3>
                <p className="text-sm text-gray-500">{producto.tipos?.nombre_tipo || 'Sin categoría'}</p>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-primary-600">
                    Bs {producto.precio?.toFixed(2) || '0'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    producto.cantidad > 10 
                      ? 'bg-green-100 text-green-700' 
                      : producto.cantidad > 0 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-red-100 text-red-700'
                  }`}>
                    Stock: {producto.cantidad || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      producto.estado 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {producto.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Link
                      href={`/dashboard/inventario/editar/${producto.id_producto}`}
                      className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      title="Editar producto"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleToggleEstado(producto.id_producto, producto.estado, producto.nombre_producto)}
                      disabled={accionEnProceso === producto.id_producto}
                      className={`p-1.5 rounded-lg transition-colors ${
                        accionEnProceso === producto.id_producto
                          ? 'opacity-50 cursor-not-allowed'
                          : producto.estado 
                            ? 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50' 
                            : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
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
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar producto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">
            {searchTerm || filtroCategoria || filtroEstado !== 'todos' 
              ? 'No hay productos que coincidan con los filtros'
              : 'No hay productos en el inventario'}
          </p>
          {(searchTerm || filtroCategoria || filtroEstado !== 'todos') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setFiltroCategoria('')
                setFiltroEstado('todos')
              }}
              className="text-primary-500 hover:underline text-sm mt-2"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {productoEliminar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-800 mb-2">¿Eliminar producto?</h3>
            <p className="text-gray-500 mb-6">
              ¿Estás seguro de que quieres eliminar <strong className="text-gray-700">"{productoEliminar.nombre}"</strong>?
              <br />
              <span className="text-sm text-red-500">Esta acción no se puede deshacer.</span>
            </p>
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
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {accionEnProceso === productoEliminar.id ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}