'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ProgramaAcademicoFormProps {
  programa?: ProgramaAcademico | null
  onSuccess?: () => void
  onClose?: () => void
  showButton?: boolean
  initialOpen?: boolean
}

interface ProgramaAcademico {
  id: number
  nombre: string
  descripcion: string | null
  duracion_anios: number | null
  titulo_otorgado: string | null
  modalidad: 'Presencial' | 'Online' | 'Híbrido' | null
  fecha_creacion: string
}

export function ProgramaAcademicoForm({ programa, onSuccess, onClose, showButton = true, initialOpen = false }: ProgramaAcademicoFormProps = {}) {
  const [isOpen, setIsOpen] = useState(initialOpen || !!programa)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    duracion_anios: '',
    titulo_otorgado: '',
    modalidad: 'Presencial' as 'Presencial' | 'Online' | 'Híbrido',
  })

  const isEditing = !!programa

  const closeModal = () => {
    setIsOpen(false)
    if (isEditing && onClose) {
      onClose()
    }
  }

  useEffect(() => {
    if (programa) {
      setFormData({
        nombre: programa.nombre,
        descripcion: programa.descripcion || '',
        duracion_anios: programa.duracion_anios?.toString() || '',
        titulo_otorgado: programa.titulo_otorgado || '',
        modalidad: programa.modalidad || 'Presencial',
      })
      setIsOpen(true)
    }
  }, [programa])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const dataToSubmit = {
      nombre: formData.nombre,
      descripcion: formData.descripcion || null,
      duracion_anios: formData.duracion_anios ? parseInt(formData.duracion_anios) : null,
      titulo_otorgado: formData.titulo_otorgado || null,
      modalidad: formData.modalidad,
    }

    if (isEditing && programa) {
      const { error } = await supabase
        .from('programas_academicos')
        .update(dataToSubmit)
        .eq('id', programa.id)

      if (error) {
        alert('Error al actualizar programa académico: ' + error.message)
      } else {
        closeModal()
        onSuccess?.()
      }
    } else {
      const { error } = await supabase
        .from('programas_academicos')
        .insert([dataToSubmit])

      if (error) {
        alert('Error al crear programa académico: ' + error.message)
      } else {
        setIsOpen(false)
        setFormData({
          nombre: '',
          descripcion: '',
          duracion_anios: '',
          titulo_otorgado: '',
          modalidad: 'Presencial',
        })
        onSuccess?.()
      }
    }

    setLoading(false)
  }

  return (
    <>
      {!isEditing && showButton && (
        <div
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg shadow-md p-6 border-2 border-dashed border-cyan-300 dark:border-cyan-600 flex items-center justify-center cursor-pointer hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors"
          title="Agregar nuevo programa académico"
        >
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-lg font-semibold text-cyan-600 dark:text-cyan-400">Agregar Programa Académico</span>
          </div>
        </div>
      )}

      {(isOpen || isEditing) && (
        <div className="fixed inset-0 bg-gray-900 overflow-y-auto min-h-screen w-full z-50">
          <div className="relative top-20 mx-auto p-6 w-full max-w-md shadow-lg rounded-md bg-gray-900 border border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-white mb-4">
                {isEditing ? 'Editar Programa Académico' : 'Nuevo Programa Académico'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-300">
                    Nombre del Programa *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    required
                    className="mt-1 block w-full bg-gray-800 text-white border-gray-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm placeholder-gray-400"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Ingeniería en Sistemas"
                  />
                </div>

                <div>
                  <label htmlFor="descripcion" className="block text-sm font-medium text-gray-300">
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    rows={3}
                    className="mt-1 block w-full bg-gray-800 text-white border-gray-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm placeholder-gray-400"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Describe el programa académico..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="duracion_anios" className="block text-sm font-medium text-gray-300">
                      Duración (años)
                    </label>
                    <input
                      type="number"
                      id="duracion_anios"
                      min="1"
                      max="10"
                      className="mt-1 block w-full bg-gray-800 text-white border-gray-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm placeholder-gray-400"
                      value={formData.duracion_anios}
                      onChange={(e) => setFormData({ ...formData, duracion_anios: e.target.value })}
                      placeholder="4"
                    />
                  </div>

                  <div>
                    <label htmlFor="modalidad" className="block text-sm font-medium text-gray-300">
                      Modalidad
                    </label>
                    <select
                      id="modalidad"
                      className="mt-1 block w-full bg-gray-800 text-white border-gray-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                      value={formData.modalidad}
                      onChange={(e) => setFormData({ ...formData, modalidad: e.target.value as 'Presencial' | 'Online' | 'Híbrido' })}
                    >
                      <option value="Presencial">Presencial</option>
                      <option value="Online">Online</option>
                      <option value="Híbrido">Híbrido</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="titulo_otorgado" className="block text-sm font-medium text-gray-300">
                    Título Otorgado
                  </label>
                  <input
                    type="text"
                    id="titulo_otorgado"
                    className="mt-1 block w-full bg-gray-800 text-white border-gray-600 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm placeholder-gray-400"
                    value={formData.titulo_otorgado}
                    onChange={(e) => setFormData({ ...formData, titulo_otorgado: e.target.value })}
                    placeholder="Ej: Ingeniero en Sistemas de Información"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="bg-gray-600 hover:bg-gray-500 text-gray-200 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    {loading ? (isEditing ? 'Actualizando...' : 'Creando...') : (isEditing ? 'Actualizar Programa' : 'Crear Programa')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}