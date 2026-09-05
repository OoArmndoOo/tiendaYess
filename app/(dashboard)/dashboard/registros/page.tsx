// app/(dashboard)/dashboard/registros/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Clock, Search, Filter, ChevronLeft, ChevronRight, Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface Registro {
  id_registro: number
  detalle_registro: string
  fecha_registro: string
  usuarios: { nombre_usuario: string } | null
  productos: { nombre_producto: string } | null
}

export default function RegistrosPage() {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const registrosPorPagina = 20

  const cargarRegistros = async () => {
    setLoading(true)
    try {
      // Obtener total de registros
      const { count, error: countError } = await supabase
        .from('registros')
        .select('*', { count: 'exact', head: true })

      if (countError) throw countError
      setTotalRegistros(count || 0)
      setTotalPaginas(Math.ceil((count || 0) / registrosPorPagina))

      // Obtener registros paginados
      const desde = (pagina - 1) * registrosPorPagina
      const hasta = desde + registrosPorPagina - 1

      let query = supabase
        .from('registros')
        .select(`
          id_registro,
          detalle_registro,
          fecha_registro,
          usuarios (nombre_usuario),
          productos (nombre_producto)
        `)
        .order('fecha_registro', { ascending: false })
        .range(desde, hasta)

      // Aplicar filtros
      if (searchTerm.trim()) {
        query = query.textSearch('detalle_registro', searchTerm.trim())
      }

      if (filtroTipo) {
        query = query.ilike('detalle_registro', `%${filtroTipo}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setRegistros(data || [])
    } catch (error) {
      console.error('Error cargando registros:', error)
      toast.error('Error al cargar los registros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarRegistros()
  }, [pagina, searchTerm, filtroTipo])

  const tiposRegistros = [
    'Creación',
    'Edición',
    'Activación',
    'Desactivación',
    'Eliminación',
    'Entrada',
    'Salida'
  ]

  const exportarCSV = () => {
    // Crear contenido CSV
    const headers = ['Fecha', 'Usuario', 'Producto', 'Detalle']
    const rows = registros.map(r => [
      new Date(r.fecha_registro).toLocaleString('es-ES'),
      r.usuarios?.nombre_usuario || 'Sistema',
      r.productos?.nombre_producto || 'Eliminado',
      r.detalle_registro
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    // Descargar CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `registros_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('Registros exportados correctamente')
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Registros de Actividad</h2>
          <p className="text-sm text-gray-500">
            {totalRegistros} movimientos registrados
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={cargarRegistros}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={exportarCSV}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en registros..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPagina(1)
              }}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filtroTipo}
              onChange={(e) => {
                setFiltroTipo(e.target.value)
                setPagina(1)
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Todos los tipos</option>
              {tiposRegistros.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>

            {filtroTipo && (
              <button
                onClick={() => {
                  setFiltroTipo('')
                  setPagina(1)
                }}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Filter className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de registros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
            <p className="text-gray-500 mt-2">Cargando registros...</p>
          </div>
        ) : registros.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {registros.map((registro) => {
                    // Determinar color según tipo de movimiento
                    let colorClass = 'text-gray-700'
                    if (registro.detalle_registro.includes('Creación')) colorClass = 'text-green-700'
                    if (registro.detalle_registro.includes('Eliminación')) colorClass = 'text-red-700'
                    if (registro.detalle_registro.includes('Desactivación')) colorClass = 'text-yellow-700'
                    if (registro.detalle_registro.includes('Activación')) colorClass = 'text-blue-700'
                    
                    return (
                      <tr key={registro.id_registro} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(registro.fecha_registro).toLocaleString('es-ES')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {registro.usuarios?.nombre_usuario || 'Sistema'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {registro.productos?.nombre_producto || 'Eliminado'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <span className={`${colorClass}`}>
                            {registro.detalle_registro}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  Mostrando {((pagina - 1) * registrosPorPagina) + 1} - {Math.min(pagina * registrosPorPagina, totalRegistros)} de {totalRegistros}
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagina(p => Math.max(1, p - 1))}
                    disabled={pagina === 1}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="flex items-center px-4 text-sm text-gray-700">
                    {pagina} / {totalPaginas}
                  </span>
                  <button
                    onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                    disabled={pagina === totalPaginas}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              {searchTerm || filtroTipo 
                ? 'No hay registros que coincidan con los filtros'
                : 'No hay registros de actividad'}
            </p>
            {(searchTerm || filtroTipo) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFiltroTipo('')
                  setPagina(1)
                }}
                className="text-primary-500 hover:underline text-sm mt-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}