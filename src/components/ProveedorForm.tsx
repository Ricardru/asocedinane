'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ProveedorFormProps {
  showButton?: boolean
  initialOpen?: boolean
}

export function ProveedorForm({ showButton = true, initialOpen = false }: ProveedorFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [personas, setPersonas] = useState<any[]>([])
  const [formData, setFormData] = useState({
    nombre: '',
    identificacion: '',
    tipo_identificacion: 'cedula',
    telefono: '',
    email: '',
    direccion: '',
    activo: true,
    persona_id: '',
  })

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        // Verificar estado de autenticación primero
        const { data: authData, error: authError } = await supabase.auth.getUser()
        console.log('Auth check in ProveedorForm:', {
          isAuthenticated: !!authData?.user,
          userId: authData?.user?.id,
          authError: authError?.message
        })

        if (authError || !authData?.user) {
          console.error('User not authenticated:', authError)
          alert('Debes iniciar sesión para acceder a esta funcionalidad.')
          window.location.href = '/login'
          return
        }

        console.log('Fetching personas for authenticated user:', authData.user.id)

        const { data, error } = await supabase
          .from('personas')
          .select('id, nombre_completo, identificacion, tipo_identificacion, telefono, email, direccion')
          .eq('activo', true)

        console.log('Supabase response:', { data: data?.length || 0, error })

        if (error) {
          console.error('Error fetching personas:', error)
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })

          // Mostrar mensaje de error al usuario
          if (error.code === 'PGRST116' || error.message?.includes('JWT') || error.message?.includes('auth')) {
            alert('Error de autenticación. Por favor, inicia sesión nuevamente.')
            window.location.href = '/login'
          } else if (error.code === '42P01') {
            alert('La tabla personas no existe. Contacta al administrador.')
          } else if (error.code === '42703') {
            alert('Error en el esquema de la base de datos. Contacta al administrador.')
          } else {
            alert('Error al cargar las personas: ' + (error.message || 'Error desconocido'))
          }
        } else {
          console.log('Personas fetched successfully:', data?.length || 0, 'records')
          setPersonas(data || [])

          if (!data || data.length === 0) {
            alert('No hay personas disponibles. Debes crear personas primero antes de crear proveedores.')
          }
        }
      } catch (err) {
        console.error('Exception fetching personas:', err)
        alert('Error inesperado al cargar personas. Revisa la consola para más detalles.')
      }
    }

    if (isOpen) {
      fetchPersonas()
    }
  }, [isOpen])

  useEffect(() => {
    if (initialOpen) {
      setIsOpen(true)
    }
  }, [initialOpen])

  const handlePersonaChange = (personaId: string) => {
    const persona = personas.find((p: any) => p.id === personaId)
    if (persona) {
      setFormData({
        ...formData,
        persona_id: personaId,
        nombre: persona.nombre_completo,
        identificacion: persona.identificacion,
        tipo_identificacion: persona.tipo_identificacion,
        telefono: persona.telefono || '',
        email: persona.email || '',
        direccion: persona.direccion || '',
      })
    } else {
      setFormData({
        ...formData,
        persona_id: personaId,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('proveedores')
      .insert([formData])

    if (error) {
      alert('Error al crear proveedor: ' + error.message)
    } else {
      setIsOpen(false)
      setFormData({
        nombre: '',
        identificacion: '',
        tipo_identificacion: 'cedula',
        telefono: '',
        email: '',
        direccion: '',
        activo: true,
        persona_id: '',
      })
      window.location.reload()
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
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Nuevo Proveedor</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="persona" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Seleccionar Persona
                  </label>
                  <select
                    id="persona"
                    required
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.persona_id}
                    onChange={(e) => handlePersonaChange(e.target.value)}
                  >
                    <option value="">Seleccionar persona...</option>
                    {personas.map((persona) => (
                      <option key={persona.id} value={persona.id}>
                        {persona.nombre_completo} - {persona.identificacion}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    required
                    readOnly={!!formData.persona_id}
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="tipo_identificacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipo de Identificación
                  </label>
                  <select
                    id="tipo_identificacion"
                    disabled={!!formData.persona_id}
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.tipo_identificacion}
                    onChange={(e) => setFormData({ ...formData, tipo_identificacion: e.target.value })}
                  >
                    <option value="cedula">Cédula</option>
                    <option value="ruc">RUC</option>
                    <option value="pasaporte">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="identificacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Identificación
                  </label>
                  <input
                    type="text"
                    id="identificacion"
                    required
                    readOnly={!!formData.persona_id}
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    value={formData.identificacion}
                    onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    id="telefono"
                    readOnly={!!formData.persona_id}
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    id="email"
                    readOnly={!!formData.persona_id}
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dirección
                  </label>
                  <textarea
                    id="direccion"
                    rows={3}
                    readOnly={!!formData.persona_id}
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    id="activo"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                    checked={formData.activo}
                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  />
                  <label htmlFor="activo" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                    Activo
                  </label>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    {loading ? 'Creando...' : 'Crear Proveedor'}
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