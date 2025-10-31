'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface BecaFormProps {
  beca?: Beca | null
  onSuccess?: () => void
  showButton?: boolean
  initialOpen?: boolean
}

interface Beca {
  id: string
  nombre: string
  descripcion?: string
  porcentaje_descuento: number
  activo?: string
}

export function BecaForm({ beca, onSuccess, showButton = true, initialOpen = false }: BecaFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    porcentaje_descuento: 0,
    activo: 'true',
  })

  const isEditing = !!beca

  const closeModal = () => {
    setIsOpen(false)
    if (isEditing) {
      // Si estamos editando, llamar onSuccess para resetear el estado de edición
      onSuccess?.()
    }
  }

  useEffect(() => {
    if (beca) {
      console.log('BecaForm recibió beca para editar:', beca.nombre, beca)
      setFormData({
        nombre: beca.nombre,
        descripcion: beca.descripcion || '',
        porcentaje_descuento: beca.porcentaje_descuento,
        activo: beca.activo || 'true',
      })
      setIsOpen(true) // Abrir el modal automáticamente cuando se recibe una beca para editar
    }
  }, [beca])

  useEffect(() => {
    if (initialOpen) {
      setIsOpen(true)
    }
  }, [initialOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (isEditing && beca) {
      const { error } = await supabase
        .from('becas')
        .update({
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
          porcentaje_descuento: formData.porcentaje_descuento,
          activo: formData.activo,
        })
        .eq('id', beca.id)

      if (error) {
        alert('Error al actualizar beca: ' + error.message)
      } else {
        closeModal()
      }
    } else {
      const { error } = await supabase
        .from('becas')
        .insert([{
          nombre: formData.nombre,
          descripcion: formData.descripcion || null,
          porcentaje_descuento: formData.porcentaje_descuento,
          activo: formData.activo,
        }])

      if (error) {
        alert('Error al crear beca: ' + error.message)
      } else {
        setIsOpen(false)
        setFormData({
          nombre: '',
          descripcion: '',
          porcentaje_descuento: 0,
          activo: 'true',
        })
        onSuccess?.()
      }
    }

    setLoading(false)
  }

  return (
    <>
      {showButton && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          +
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[800px] max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{isEditing ? 'Editar Beca' : 'Nueva Beca'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    required
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
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
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="porcentaje_descuento" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Porcentaje de Descuento (%)
                  </label>
                  <input
                    type="number"
                    id="porcentaje_descuento"
                    required
                    min="0"
                    max="100"
                    step="0.01"
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    value={formData.porcentaje_descuento}
                    onChange={(e) => setFormData({ ...formData, porcentaje_descuento: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Valor entre 0.00 y 100.00
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="activo"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                      checked={formData.activo === 'true'}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked ? 'true' : 'false' })}
                    />
                    <label htmlFor="activo" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                      Activo
                    </label>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                    >
                      {loading ? (isEditing ? 'Actualizando...' : 'Creando...') : (isEditing ? 'Actualizar Beca' : 'Crear Beca')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}