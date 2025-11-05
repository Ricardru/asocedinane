"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ResponsableAlumnoFormProps {
  responsable?: any | null
  onSuccess?: () => void
  onClose?: () => void
  showButton?: boolean
  initialOpen?: boolean
}

interface TipoRelacion {
  id_tipo_relacion: number
  descripcion: string
  activo: boolean
}

interface Persona {
  id: string
  nombre_completo: string
  identificacion: string
  telefono: string
  email: string
}

export function ResponsableAlumnoForm({
  responsable,
  onSuccess,
  onClose,
  showButton = true,
  initialOpen = false
}: ResponsableAlumnoFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [alumnos, setAlumnos] = useState<Persona[]>([])
  const [tiposRelacion, setTiposRelacion] = useState<TipoRelacion[]>([])

  const [formData, setFormData] = useState({
    id_persona_responsable: '',
    id_alumno: '',
    id_tipo_relacion: '',
    ind_contacto_principal: false,
    ind_autorizado_retiro: false
  })

  const isEditing = !!responsable

  const closeModal = () => {
    setIsOpen(false)
    onClose?.()
  }

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Obtener personas (potenciales responsables)
        const { data: personasData } = await supabase
          .from('personas')
          .select('id, nombre_completo, identificacion, telefono, email')
          .eq('activo', true)
          .order('nombre_completo', { ascending: true })

        // Obtener alumnos (personas que son alumnos)
        const { data: alumnosData } = await supabase
          .from('alumnos')
          .select(`
            id,
            persona:personas(
              nombre_completo,
              identificacion,
              telefono,
              email
            )
          `)
          .eq('activo', true)

        // Obtener tipos de relación
        const { data: tiposData } = await supabase
          .from('tipo_relacion')
          .select('id_tipo_relacion, descripcion, activo')
          .eq('activo', true)
          .order('descripcion', { ascending: true })

        setPersonas(personasData || [])
        setAlumnos(alumnosData?.map((a: any) => ({
          id: a.id,
          nombre_completo: a.persona?.nombre_completo || '',
          identificacion: a.persona?.identificacion || '',
          telefono: a.persona?.telefono || '',
          email: a.persona?.email || ''
        })) || [])
        setTiposRelacion(tiposData || [])
      } catch (error) {
        console.error('Error fetching options:', error)
      }
    }
    fetchOptions()
  }, [])

  useEffect(() => {
    if (responsable) {
      setFormData({
        id_persona_responsable: responsable.id_persona_responsable,
        id_alumno: responsable.id_alumno,
        id_tipo_relacion: responsable.id_tipo_relacion.toString(),
        ind_contacto_principal: responsable.ind_contacto_principal || false,
        ind_autorizado_retiro: responsable.ind_autorizado_retiro || false
      })
      setIsOpen(true)
    }
  }, [responsable])

  useEffect(() => {
    if (initialOpen) setIsOpen(true)
  }, [initialOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.id_persona_responsable || !formData.id_alumno || !formData.id_tipo_relacion) {
      alert('Todos los campos son obligatorios.')
      setLoading(false)
      return
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('responsable_alumno')
          .update({
            id_persona_responsable: formData.id_persona_responsable,
            id_alumno: formData.id_alumno,
            id_tipo_relacion: parseInt(formData.id_tipo_relacion),
            ind_contacto_principal: formData.ind_contacto_principal,
            ind_autorizado_retiro: formData.ind_autorizado_retiro
          })
          .eq('id_responsable_alumno', responsable.id_responsable_alumno)

        if (error) {
          console.error('Error updating responsable:', error)
          alert('Error al actualizar: ' + error.message)
        } else {
          onSuccess?.()
          closeModal()
        }
      } else {
        const { error } = await supabase
          .from('responsable_alumno')
          .insert([{
            id_persona_responsable: formData.id_persona_responsable,
            id_alumno: formData.id_alumno,
            id_tipo_relacion: parseInt(formData.id_tipo_relacion),
            ind_contacto_principal: formData.ind_contacto_principal,
            ind_autorizado_retiro: formData.ind_autorizado_retiro
          }])

        if (error) {
          console.error('Error creating responsable:', error)
          alert('Error al crear: ' + error.message)
        } else {
          setFormData({
            id_persona_responsable: '',
            id_alumno: '',
            id_tipo_relacion: '',
            ind_contacto_principal: false,
            ind_autorizado_retiro: false
          })
          onSuccess?.()
          closeModal()
        }
      }
    } catch (err: any) {
      console.error('Exception in ResponsableAlumnoForm submit', err)
      alert('Ocurrió un error procesando la solicitud.')
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
          + Asociar Responsable
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[600px] max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {isEditing ? 'Editar Asociación' : 'Nueva Asociación Responsable-Alumno'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Persona Responsable
                  </label>
                  <select
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md"
                    value={formData.id_persona_responsable}
                    onChange={(e) => setFormData({ ...formData, id_persona_responsable: e.target.value })}
                    required
                  >
                    <option value="">-- Selecciona responsable --</option>
                    {personas.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre_completo} - {p.identificacion}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Alumno
                  </label>
                  <select
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md"
                    value={formData.id_alumno}
                    onChange={(e) => setFormData({ ...formData, id_alumno: e.target.value })}
                    required
                  >
                    <option value="">-- Selecciona alumno --</option>
                    {alumnos.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.nombre_completo} - {a.identificacion}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipo de Relación
                  </label>
                  <select
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md"
                    value={formData.id_tipo_relacion}
                    onChange={(e) => setFormData({ ...formData, id_tipo_relacion: e.target.value })}
                    required
                  >
                    <option value="">-- Selecciona tipo de relación --</option>
                    {tiposRelacion.map(t => (
                      <option key={t.id_tipo_relacion} value={t.id_tipo_relacion.toString()}>
                        {t.descripcion}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="contacto_principal"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                      checked={formData.ind_contacto_principal}
                      onChange={(e) => setFormData({ ...formData, ind_contacto_principal: e.target.checked })}
                    />
                    <label htmlFor="contacto_principal" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                      Contacto Principal
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="autorizado_retiro"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                      checked={formData.ind_autorizado_retiro}
                      onChange={(e) => setFormData({ ...formData, ind_autorizado_retiro: e.target.checked })}
                    />
                    <label htmlFor="autorizado_retiro" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                      Autorizado para Retiro
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
                    {loading ? (isEditing ? 'Actualizando...' : 'Creando...') : (isEditing ? 'Actualizar' : 'Crear Asociación')}
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