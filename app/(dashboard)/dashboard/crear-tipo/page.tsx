// app/(dashboard)/dashboard/crear-tipo/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

export default function CrearTipoPage() {
  const [nombre, setNombre] = useState('')
  const [tipos, setTipos] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const cargarTipos = async () => {
    const { data } = await supabase
      .from('tipos')
      .select('*')
      .order('nombre_tipo')
    setTipos(data || [])
  }

  useEffect(() => {
    cargarTipos()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setLoading(true)
    const { error } = await supabase
      .from('tipos')
      .insert({ nombre_tipo: nombre.trim() })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Tipo creado exitosamente')
      setNombre('')
      cargarTipos()
    }
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este tipo?')) return

    const { error } = await supabase
      .from('tipos')
      .delete()
      .eq('id_tipo', id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Tipo eliminado')
      cargarTipos()
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Crear Tipo de Producto</h2>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del tipo (ej: Electrónica)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Crear'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Tipos existentes</h3>
        {tipos.length > 0 ? (
          <ul className="space-y-2">
            {tipos.map((tipo) => (
              <li key={tipo.id_tipo} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                <span className="text-gray-700">{tipo.nombre_tipo}</span>
                <button
                  onClick={() => handleDelete(tipo.id_tipo)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">No hay tipos creados</p>
        )}
      </div>
    </div>
  )
}