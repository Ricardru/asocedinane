'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface CategoriaEgreso {
  id: string
  nombre: string
  descripcion: string
  activo: boolean
}

interface CategoriaEgresoFormProps {
  categoria?: CategoriaEgreso
  onClose: () => void
}

export function CategoriaEgresoForm({ categoria, onClose }: CategoriaEgresoFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    activo: true,
  })

  useEffect(() => {
    if (categoria) {
      setFormData({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || '',
        activo: categoria.activo,
      })
    }
  }, [categoria])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = categoria
      ? await supabase
          .from('categorias_egresos')
          .update(formData)
          .eq('id', categoria.id)
      : await supabase
          .from('categorias_egresos')
          .insert([formData])

    if (error) {
      alert(`Error al ${categoria ? 'actualizar' : 'crear'} categoría de egreso: ${error.message}`)
    } else {
      onClose()
      window.location.reload()
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {categoria ? 'Editar' : 'Nueva'} Categoría de Egreso
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre
              </label>
              <input
                type="text"
                id="nombre"
                required
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción
              </label>
              <textarea
                id="descripcion"
                rows={3}
                className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              />
            </div>
            <div className="flex items-center">
              <input
                id="activo"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              />
              <label htmlFor="activo" className="ml-2 block text-sm text-gray-900 dark:text-white">
                Activo
              </label>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              >
                {loading ? (categoria ? 'Actualizando...' : 'Creando...') : (categoria ? 'Actualizar' : 'Crear')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}