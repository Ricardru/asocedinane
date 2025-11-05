"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ResponsableAlumnoForm } from './ResponsableAlumnoForm'

interface ResponsableAlumno {
  id_responsable_alumno: string
  id_persona_responsable: string
  id_alumno: string
  id_tipo_relacion: number
  ind_contacto_principal: boolean
  ind_autorizado_retiro: boolean
  created_at: string
  // Datos relacionados
  responsable?: {
    nombre_completo: string
    identificacion: string
    telefono: string
    email: string
  }
  alumno?: {
    nombre_completo: string
    identificacion: string
  }
  tipo_relacion?: {
    descripcion: string
  }
}

export function ResponsableAlumnoList() {
  const [responsables, setResponsables] = useState<ResponsableAlumno[]>([])
  const [loading, setLoading] = useState(true)
  const [editingResponsable, setEditingResponsable] = useState<ResponsableAlumno | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchResponsables = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('responsable_alumno')
        .select(`
          *,
          responsable:personas!fk_persona_responsable(
            nombre_completo,
            identificacion,
            telefono,
            email
          ),
          alumno:personas!alumnos(
            nombre_completo,
            identificacion
          ),
          tipo_relacion(
            descripcion
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching responsables:', error)
        setResponsables([])
      } else {
        setResponsables(data || [])
      }
    } catch (err) {
      console.error('Exception fetching responsables:', err)
      setResponsables([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchResponsables()
  }, [])

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta asociación?')) return

    try {
      const { error } = await supabase
        .from('responsable_alumno')
        .delete()
        .eq('id_responsable_alumno', id)

      if (error) {
        alert('Error al eliminar: ' + error.message)
      } else {
        fetchResponsables()
      }
    } catch (err) {
      console.error('Exception deleting responsable:', err)
      alert('Ocurrió un error al eliminar')
    }
  }

  const filteredResponsables = responsables.filter(r => {
    const responsableName = r.responsable?.nombre_completo || ''
    const alumnoName = r.alumno?.nombre_completo || ''
    const tipo = r.tipo_relacion?.descripcion || ''
    const searchLower = searchTerm.toLowerCase()

    return responsableName.toLowerCase().includes(searchLower) ||
           alumnoName.toLowerCase().includes(searchLower) ||
           tipo.toLowerCase().includes(searchLower)
  })

  if (loading) return <div>Cargando...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#01257D] dark:text-cyan-400">Responsables de Alumnos</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar responsables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-64 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500"
            />
          </div>
          <ResponsableAlumnoForm onSuccess={fetchResponsables} />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredResponsables.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
              No hay asociaciones de responsables registradas
            </li>
          ) : (
            filteredResponsables.map(r => (
              <li key={r.id_responsable_alumno} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {r.responsable?.nombre_completo || 'Responsable desconocido'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                          {r.responsable?.identificacion || ''}
                        </p>
                      </div>
                      <div className="ml-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Alumno:</span> {r.alumno?.nombre_completo || 'Alumno desconocido'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Relación:</span> {r.tipo_relacion?.descripcion || 'Tipo desconocido'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-4">
                      {r.ind_contacto_principal && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Contacto Principal
                        </span>
                      )}
                      {r.ind_autorizado_retiro && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Autorizado para Retiro
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingResponsable(r)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                      title="Editar"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(r.id_responsable_alumno)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {editingResponsable && (
        <ResponsableAlumnoForm
          responsable={editingResponsable}
          onSuccess={() => { setEditingResponsable(null); fetchResponsables() }}
          onClose={() => setEditingResponsable(null)}
        />
      )}
    </div>
  )
}