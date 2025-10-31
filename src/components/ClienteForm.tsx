'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ClienteFormProps {
  cliente?: Cliente | null
  onClose?: () => void
  showButton?: boolean
  initialOpen?: boolean
}

interface Cliente {
  id: string
  nombre?: string
  identificacion?: string
  tipo_identificacion?: string
  telefono?: string
  email?: string
  direccion?: string
  persona_id?: string
  activo: boolean
  personas?: {
    nombre_completo?: string
    identificacion?: string
    tipo_identificacion?: string
    telefono?: string
    email?: string
    direccion?: string
    pais_id?: number
    departamento_id?: number
    ciudad_id?: number
    barrio_id?: number
  }
}

export function ClienteForm({ cliente, onClose, showButton = true, initialOpen = false }: ClienteFormProps = {}) {
  const [isOpen, setIsOpen] = useState(initialOpen) // Usar initialOpen para abrir automáticamente
  const [loading, setLoading] = useState(false)
  const [personas, setPersonas] = useState<any[]>([])
  const [ubicacionData, setUbicacionData] = useState({
    paises: [] as { id: number; nombre: string }[],
    departamentos: [] as { id: number; nombre: string }[],
    ciudades: [] as { id: number; nombre: string }[],
    barrios: [] as { id: number; nombre: string }[]
  })
  const [formData, setFormData] = useState({
    nombre: '',
    identificacion: '',
    tipo_identificacion: 'cedula',
    telefono: '',
    email: '',
    direccion: '',
    activo: true,
    persona_id: '',
    pais_id: '',
    departamento_id: '',
    ciudad_id: '',
    barrio_id: ''
  })

  const isEditing = !!cliente

  const closeModal = () => {
    setIsOpen(false)
    if ((isEditing || initialOpen) && onClose) {
      onClose()
    }
  }

  useEffect(() => {
    if (cliente) {
      // Cargar datos del cliente para edición
      setFormData({
        nombre: cliente.nombre || cliente.personas?.nombre_completo || '',
        identificacion: cliente.identificacion || cliente.personas?.identificacion || '',
        tipo_identificacion: cliente.tipo_identificacion || cliente.personas?.tipo_identificacion || 'cedula',
        telefono: cliente.telefono || cliente.personas?.telefono || '',
        email: cliente.email || cliente.personas?.email || '',
        direccion: cliente.direccion || cliente.personas?.direccion || '',
        activo: cliente.activo,
        persona_id: cliente.persona_id || '',
        pais_id: cliente.personas?.pais_id?.toString() || '',
        departamento_id: cliente.personas?.departamento_id?.toString() || '',
        ciudad_id: cliente.personas?.ciudad_id?.toString() || '',
        barrio_id: cliente.personas?.barrio_id?.toString() || ''
      })
      setIsOpen(true)
    }
  }, [cliente])

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        // Verificar estado de autenticación primero
        const { data: authData, error: authError } = await supabase.auth.getUser()
        console.log('Auth check in ClienteForm:', {
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
          .select('id, nombre_completo, identificacion, tipo_identificacion, telefono, email, direccion, pais_id, departamento_id, ciudad_id, barrio_id')
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
            alert('No hay personas disponibles. Debes crear personas primero antes de crear clientes.')
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
    const loadUbicacionData = async () => {
      try {
        const [paisesRes, deptosRes, ciudadesRes, barriosRes] = await Promise.all([
          supabase.from('paises').select('id, nombre'),
          supabase.from('departamentos').select('id, nombre'),
          supabase.from('ciudades').select('id, nombre'),
          supabase.from('barrios').select('id, nombre')
        ])

        setUbicacionData({
          paises: paisesRes.data || [],
          departamentos: deptosRes.data || [],
          ciudades: ciudadesRes.data || [],
          barrios: barriosRes.data || []
        })
      } catch (error) {
        console.error('Error cargando datos de ubicación:', error)
      }
    }

    if (isOpen) {
      loadUbicacionData()
    }
  }, [isOpen])

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
        pais_id: persona.pais_id?.toString() || '',
        departamento_id: persona.departamento_id?.toString() || '',
        ciudad_id: persona.ciudad_id?.toString() || '',
        barrio_id: persona.barrio_id?.toString() || ''
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

    if (isEditing && cliente) {
      // Actualizar cliente existente
      const updateData: any = {
        nombre: formData.nombre,
        identificacion: formData.identificacion,
        tipo_identificacion: formData.tipo_identificacion,
        telefono: formData.telefono,
        email: formData.email,
        direccion: formData.direccion,
        activo: formData.activo,
        persona_id: formData.persona_id || null,
      }

      const { error: clienteError } = await supabase
        .from('clientes')
        .update(updateData)
        .eq('id', cliente.id)

      if (clienteError) {
        alert('Error al actualizar cliente: ' + clienteError.message)
        setLoading(false)
        return
      }

      // Si hay persona_id, actualizar también la ubicación de la persona
      if (formData.persona_id) {
        const ubicacionUpdate: any = {}
        if (formData.pais_id) ubicacionUpdate.pais_id = parseInt(formData.pais_id)
        if (formData.departamento_id) ubicacionUpdate.departamento_id = parseInt(formData.departamento_id)
        if (formData.ciudad_id) ubicacionUpdate.ciudad_id = parseInt(formData.ciudad_id)
        if (formData.barrio_id) ubicacionUpdate.barrio_id = parseInt(formData.barrio_id)

        if (Object.keys(ubicacionUpdate).length > 0) {
          const { error: personaError } = await supabase
            .from('personas')
            .update(ubicacionUpdate)
            .eq('id', formData.persona_id)

          if (personaError) {
            console.error('Error al actualizar ubicación de persona:', personaError)
            // No mostrar error al usuario ya que el cliente se actualizó correctamente
          }
        }
      }

      closeModal()
      window.location.reload()
    } else {
      // Crear nuevo cliente
      const { error } = await supabase
        .from('clientes')
        .insert([{
          nombre: formData.nombre,
          identificacion: formData.identificacion,
          tipo_identificacion: formData.tipo_identificacion,
          telefono: formData.telefono,
          email: formData.email,
          direccion: formData.direccion,
          activo: formData.activo,
          persona_id: formData.persona_id || null,
        }])

      if (error) {
        alert('Error al crear cliente: ' + error.message)
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
          pais_id: '',
          departamento_id: '',
          ciudad_id: '',
          barrio_id: ''
        })
        if (onClose) onClose()
        window.location.reload()
      }
    }

    setLoading(false)
  }

  return (
    <>
      {!isEditing && showButton && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
          title="Nuevo Cliente"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      )}

      {(isOpen || isEditing || initialOpen) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h3>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pais_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      País
                    </label>
                    <select
                      id="pais_id"
                      disabled={!!formData.persona_id}
                      className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.pais_id}
                      onChange={(e) => setFormData({ ...formData, pais_id: e.target.value })}
                    >
                      <option value="">Seleccionar país...</option>
                      {ubicacionData.paises.map((pais) => (
                        <option key={pais.id} value={pais.id}>
                          {pais.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="departamento_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Departamento
                    </label>
                    <select
                      id="departamento_id"
                      disabled={!!formData.persona_id}
                      className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.departamento_id}
                      onChange={(e) => setFormData({ ...formData, departamento_id: e.target.value })}
                    >
                      <option value="">Seleccionar departamento...</option>
                      {ubicacionData.departamentos.map((depto) => (
                        <option key={depto.id} value={depto.id}>
                          {depto.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ciudad_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ciudad
                    </label>
                    <select
                      id="ciudad_id"
                      disabled={!!formData.persona_id}
                      className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.ciudad_id}
                      onChange={(e) => setFormData({ ...formData, ciudad_id: e.target.value })}
                    >
                      <option value="">Seleccionar ciudad...</option>
                      {ubicacionData.ciudades.map((ciudad) => (
                        <option key={ciudad.id} value={ciudad.id}>
                          {ciudad.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="barrio_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Barrio
                    </label>
                    <select
                      id="barrio_id"
                      disabled={!!formData.persona_id}
                      className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.barrio_id}
                      onChange={(e) => setFormData({ ...formData, barrio_id: e.target.value })}
                    >
                      <option value="">Seleccionar barrio...</option>
                      {ubicacionData.barrios.map((barrio) => (
                        <option key={barrio.id} value={barrio.id}>
                          {barrio.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
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
                    {loading ? (isEditing ? 'Actualizando...' : 'Creando...') : (isEditing ? 'Actualizar Cliente' : 'Crear Cliente')}
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