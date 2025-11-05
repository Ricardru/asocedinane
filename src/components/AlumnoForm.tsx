"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface AlumnoFormProps {
  alumno?: any | null
  onSuccess?: () => void
  onClose?: () => void
  showButton?: boolean
  initialOpen?: boolean
}

export function AlumnoForm({ alumno, onSuccess, onClose, showButton = true, initialOpen = false }: AlumnoFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [personas, setPersonas] = useState<any[]>([])
  const [turnos, setTurnos] = useState<any[]>([])
  const [becas, setBecas] = useState<any[]>([])

  const [formData, setFormData] = useState<any>({
    id: '', // persona id
    id_turno: null,
    activo: true,
    fecha_inscripcion: '',
    RUE: false,
    motivo_rue: '',
    beca_id: ''
  })

  const isEditing = !!alumno

  const closeModal = () => {
    setIsOpen(false)
    onClose?.()
    if (isEditing) onSuccess?.()
  }

  useEffect(() => {
    const fetchOptions = async () => {
      const [{ data: pData }, { data: tData }, { data: bData }] = await Promise.all([
        supabase.from('personas').select('id, nombre_completo, identificacion, email, telefono, direccion, fec_nacimiento, sexo, nacionalidad_id, foto_path').order('nombre_completo', { ascending: true }),
        supabase.from('turnos').select('id,nombre').order('nombre', { ascending: true }),
        supabase.from('becas').select('id,nombre,porcentaje_descuento').order('nombre', { ascending: true }),
      ])

      const persons = pData || []
      // attach public urls if foto_path present (best-effort)
      for (const p of persons) {
        try {
          if (p.foto_path) {
            const publicUrl = supabase.storage.from('personas-photos').getPublicUrl(p.foto_path).data.publicUrl
            // p may have a strict type from the DB result; cast to any to attach a UI-only field
            ;(p as any).foto_public_url = publicUrl
          }
        } catch (e) { /* ignore */ }
      }

      setPersonas(persons)
      setTurnos(tData || [])
      setBecas(bData || [])
    }
    fetchOptions()
  }, [])

  useEffect(() => {
    if (alumno) {
      setFormData({
        id: alumno.id,
        id_turno: alumno.id_turno ?? null,
        activo: alumno.activo ?? true,
        fecha_inscripcion: alumno.fecha_inscripcion || new Date().toISOString().split('T')[0],
        RUE: alumno.RUE ?? false,
        motivo_rue: alumno.motivo_rue || '',
        beca_id: alumno.beca_id || ''
      })
      setIsOpen(true)
    }
  }, [alumno])

  useEffect(() => {
    if (initialOpen) setIsOpen(true)
  }, [initialOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.id) {
      alert('Selecciona una persona para crear el alumno.')
      setLoading(false)
      return
    }

    try {
      if (isEditing) {
        const { error } = await supabase.from('alumnos').update({
          id_turno: formData.id_turno || null,
          activo: formData.activo,
          fecha_inscripcion: formData.fecha_inscripcion,
          RUE: formData.RUE,
          motivo_rue: formData.motivo_rue || null,
          beca_id: formData.beca_id || null
        }).eq('id', formData.id)

        if (error) alert('Error al actualizar alumno: ' + error.message)
        else closeModal()
      } else {
        const { error } = await supabase.from('alumnos').insert([{
          id: formData.id,
          id_turno: formData.id_turno || null,
          activo: formData.activo,
          fecha_inscripcion: formData.fecha_inscripcion || new Date().toISOString().split('T')[0],
          RUE: formData.RUE,
          motivo_rue: formData.motivo_rue || null,
          beca_id: formData.beca_id || null,
        }])

        if (error) alert('Error al crear alumno: ' + error.message)
        else {
          setIsOpen(false)
          setFormData({ id: '', id_turno: null, activo: true, fecha_inscripcion: new Date().toISOString().split('T')[0], RUE: false, motivo_rue: '', beca_id: '' })
          onSuccess?.()
          onClose?.()
        }
      }
    } catch (err: any) {
      console.error('Exception in AlumnoForm submit', err)
      alert('Ocurrió un error procesando la solicitud.')
    }

    setLoading(false)
  }

  return (
    <>
      {showButton && (
        <button onClick={() => setIsOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">+</button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[800px] max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{isEditing ? 'Editar Alumno' : 'Nuevo Alumno'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Persona</label>
                  <select className="mt-1 block w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md" value={formData.id} onChange={(e) => setFormData({ ...formData, id: e.target.value })} required>
                    <option value="">-- Selecciona persona --</option>
                    {personas.map(p => <option key={p.id} value={p.id}>{p.nombre_completo}</option>)}
                  </select>

                  {/* Vista previa de datos de la persona seleccionada */}
                  {formData.id && (
                    (() => {
                      const sel = personas.find(x => x.id === formData.id)
                      if (!sel) return null
                      return (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100">
                          <div className="flex items-center">
                            {sel.foto_public_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={sel.foto_public_url} alt="foto" className="w-16 h-16 object-cover rounded-md mr-3" />
                            ) : (
                              <div className="w-16 h-16 bg-[#01257D] rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">{(sel.nombre_completo || 'S').charAt(0).toUpperCase()}</div>
                            )}
                            <div>
                              <div className="font-semibold">{sel.nombre_completo}</div>
                              <div className="text-xs">{sel.identificacion || ''}</div>
                              <div className="text-xs">{sel.email || ''}</div>
                              <div className="text-xs">{sel.telefono || ''}</div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs">{sel.direccion || ''}</div>
                        </div>
                      )
                    })()
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Turno</label>
                  <select className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md" value={formData.id_turno ?? ''} onChange={(e) => setFormData({ ...formData, id_turno: e.target.value ? Number(e.target.value) : null })}>
                    <option value="">-- Sin turno asignado --</option>
                    {turnos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Beca</label>
                  <select className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md" value={formData.beca_id || ''} onChange={(e) => setFormData({ ...formData, beca_id: e.target.value })}>
                    <option value="">-- Sin beca --</option>
                    {becas.map(b => <option key={b.id} value={b.id}>{b.nombre} ({b.porcentaje_descuento}%)</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Inscripción</label>
                    <input type="date" className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md" value={formData.fecha_inscripcion || new Date().toISOString().split('T')[0]} onChange={(e) => setFormData({ ...formData, fecha_inscripcion: e.target.value })} />
                  </div>
                  <div className="flex items-center">
                    <input id="RUE" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded" checked={!!formData.RUE} onChange={(e) => setFormData({ ...formData, RUE: e.target.checked })} />
                    <label htmlFor="RUE" className="ml-2 block text-sm font-medium text-gray-900 dark:text-gray-200">RUE</label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Motivo RUE</label>
                  <textarea className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md" rows={3} value={formData.motivo_rue} onChange={(e) => setFormData({ ...formData, motivo_rue: e.target.value })} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input id="activo" type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded" checked={!!formData.activo} onChange={(e) => setFormData({ ...formData, activo: e.target.checked })} />
                    <label htmlFor="activo" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Activo</label>
                  </div>
                  <div className="flex space-x-3">
                    <button type="button" onClick={closeModal} className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium">Cancelar</button>
                    <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50">{loading ? (isEditing ? 'Actualizando...' : 'Creando...') : (isEditing ? 'Actualizar Alumno' : 'Crear Alumno')}</button>
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
