"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface TurnoFormProps {
  turno?: Turno | null
  onSuccess?: () => void
  onClose?: () => void
  showButton?: boolean
  initialOpen?: boolean
}

interface Turno {
  id: string
  codigo?: string
  nombre: string
  hora_inicio?: string
  hora_fin?: string
  activo?: boolean
  lunes?: boolean
  martes?: boolean
  miercoles?: boolean
  jueves?: boolean
  viernes?: boolean
  sabado?: boolean
  domingo?: boolean
}

export function TurnoForm({ turno, onSuccess, onClose, showButton = true, initialOpen = false }: TurnoFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [codigoOverwritten, setCodigoOverwritten] = useState(false)
  const [timesAuto, setTimesAuto] = useState(true)
  const [nombreEdited, setNombreEdited] = useState(false)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    hora_inicio: '',
    hora_fin: '',
    activo: true,
    tipo: '',
    lunes: false,
    martes: false,
    miercoles: false,
    jueves: false,
    viernes: false,
    sabado: false,
    domingo: false,
  })

  const isEditing = !!turno

  // map tipo to letter
  const tipoLetter = (tipo: string) => {
    if (!tipo) return ''
    if (tipo === 'Mañana') return 'M'
    if (tipo === 'Tarde') return 'T'
    if (tipo === 'Completo') return 'C'
    return tipo.charAt(0).toUpperCase()
  }

  // Generate a human-readable nombre for the turno
  const generateNombre = (data: any) => {
    const tipo = data.tipo || ''
    const tipoText = tipo ? `Turno ${tipo}` : 'Turno'
    const weekdayMap = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
    const flags = [data.lunes, data.martes, data.miercoles, data.jueves, data.viernes]
    const allWeekdays = flags.every(Boolean)
    const selected = weekdayMap.filter((_, idx) => flags[idx])
    if (allWeekdays || selected.length === 0) return tipoText
    return `${tipoText} - ${selected.join(' ')}`
  }

  // Generate codigo according to rules described by user
  const generateCodigo = (data: any) => {
    const letter = tipoLetter(data.tipo || '')
    if (!letter) return 'T'

    // weekdays in order: lunes, martes, miercoles, jueves, viernes
    const weekdayFlags = [data.lunes, data.martes, data.miercoles, data.jueves, data.viernes]
    const allWeekdays = weekdayFlags.every(Boolean)
    const initialsMap = ['L', 'M', 'M', 'J', 'V']
    const selectedInitials = initialsMap.filter((_, idx) => weekdayFlags[idx])

    if (allWeekdays) {
      // Only prefix T + letter
      return `T${letter}`
    }

    if (selectedInitials.length === 0) {
      return `T${letter}`
    }

    return `T${letter}-${selectedInitials.join('')}`
  }

  const closeModal = () => {
    setIsOpen(false)
    if (isEditing) {
      onSuccess?.()
    }
    onClose?.()
  }

  useEffect(() => {
    if (turno) {
      setFormData({
        codigo: turno.codigo || '',
        nombre: turno.nombre,
        hora_inicio: turno.hora_inicio || '',
        hora_fin: turno.hora_fin || '',
        activo: turno.activo ?? true,
        tipo: (turno as any).tipo ?? '',
        lunes: turno.lunes ?? false,
        martes: turno.martes ?? false,
        miercoles: turno.miercoles ?? false,
        jueves: turno.jueves ?? false,
        viernes: turno.viernes ?? false,
        sabado: turno.sabado ?? false,
        domingo: turno.domingo ?? false,
      })
      setIsOpen(true)
    }
  }, [turno])

  // When opening the modal for creating (not editing), ensure codigo starts with 'T' and is generated live
  useEffect(() => {
    if (isOpen && !isEditing) {
      setFormData(prev => ({ ...prev, codigo: prev.codigo || 'T' }))
    }
  }, [isOpen, isEditing])

  // Recompute codigo live when tipo or day flags change (only when creating)
  useEffect(() => {
    if (isEditing) return
    const newCodigo = generateCodigo(formData)
    const newNombre = generateNombre(formData)
    setFormData(prev => ({ ...prev, codigo: newCodigo, nombre: nombreEdited ? prev.nombre : newNombre }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.tipo, formData.lunes, formData.martes, formData.miercoles, formData.jueves, formData.viernes, nombreEdited])

  // ensure timesAuto defaults: if editing, assume user-managed times; if creating, allow auto
  useEffect(() => {
    if (turno) setTimesAuto(false)
  }, [turno])

  // when tipo changes we may want to auto-fill times depending on timesAuto
  const handleTipoChange = (value: string) => {
    const defaults: Record<string, { hi: string; hf: string }> = {
      'Mañana': { hi: '08:00', hf: '11:30' },
      'Tarde': { hi: '12:30', hf: '16:00' },
      'Completo': { hi: '08:00', hf: '16:00' }
    }

    const shouldAuto = timesAuto || (!formData.hora_inicio && !formData.hora_fin)
    if (shouldAuto && defaults[value]) {
      setFormData(prev => ({ ...prev, tipo: value, hora_inicio: defaults[value].hi, hora_fin: defaults[value].hf }))
      setTimesAuto(true)
    } else {
      setFormData(prev => ({ ...prev, tipo: value }))
    }
  }

  useEffect(() => {
    if (initialOpen) setIsOpen(true)
  }, [initialOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validaciones básicas
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      alert('Código y Nombre son obligatorios.')
      setLoading(false)
      return
    }
    if (!formData.hora_inicio || !formData.hora_fin) {
      alert('Debe completar Hora Inicio y Hora Fin.')
      setLoading(false)
      return
    }
    // comprobar que hora_inicio < hora_fin (formato HH:MM)
    if (formData.hora_inicio >= formData.hora_fin) {
      alert('La Hora Inicio debe ser anterior a la Hora Fin.')
      setLoading(false)
      return
    }

    try {
      if (isEditing && turno) {
        const { error } = await supabase
          .from('turnos')
          .update({
            codigo: formData.codigo || null,
            nombre: formData.nombre,
            hora_inicio: formData.hora_inicio,
            hora_fin: formData.hora_fin,
            activo: formData.activo,
            tipo: formData.tipo || null,
            lunes: formData.lunes,
            martes: formData.martes,
            miercoles: formData.miercoles,
            jueves: formData.jueves,
            viernes: formData.viernes,
            sabado: formData.sabado,
            domingo: formData.domingo,
          })
          .eq('id', turno.id)

        if (error) {
          alert('Error al actualizar turno: ' + error.message)
        } else {
          closeModal()
        }
      } else {
        const { error } = await supabase
          .from('turnos')
          .insert([{
            codigo: formData.codigo || null,
            nombre: formData.nombre,
            hora_inicio: formData.hora_inicio,
            hora_fin: formData.hora_fin,
            activo: formData.activo,
            tipo: formData.tipo || null,
            lunes: formData.lunes,
            martes: formData.martes,
            miercoles: formData.miercoles,
            jueves: formData.jueves,
            viernes: formData.viernes,
            sabado: formData.sabado,
            domingo: formData.domingo,
          }])

        if (error) {
          alert('Error al crear turno: ' + error.message)
        } else {
          setIsOpen(false)
          setFormData({ codigo: '', nombre: '', hora_inicio: '', hora_fin: '', activo: true, tipo: '', lunes: false, martes: false, miercoles: false, jueves: false, viernes: false, sabado: false, domingo: false })
          onSuccess?.()
        }
      }
    } catch (err: any) {
      console.error('Exception in TurnoForm submit', err)
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
          +
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[800px] max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{isEditing ? 'Editar Turno' : 'Nuevo Turno'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Código</label>
                  <div className="flex items-center space-x-2">
                    <input
                      id="codigo"
                      type="text"
                      readOnly
                      title="Código generado automáticamente"
                      className="mt-1 block w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-75"
                      value={formData.codigo}
                    />
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          const newCodigo = generateCodigo(formData)
                          const newNombre = generateNombre(formData)
                          // defaults for horas
                          const defaults: Record<string, { hi: string; hf: string }> = {
                            'Mañana': { hi: '08:00', hf: '11:30' },
                            'Tarde': { hi: '12:30', hf: '16:00' },
                            'Completo': { hi: '08:00', hf: '16:00' }
                          }
                          const d = defaults[formData.tipo] || { hi: formData.hora_inicio || '', hf: formData.hora_fin || '' }
                          setFormData(prev => ({ ...prev, codigo: newCodigo, nombre: newNombre, hora_inicio: d.hi, hora_fin: d.hf }))
                          setCodigoOverwritten(true)
                          // after recalculation we allow auto behaviour for times
                          setTimesAuto(true)
                          setNombreEdited(false)
                        }}
                        className="mt-1 inline-flex items-center px-2 py-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md text-sm"
                        title="Recalcular código según tipo y días"
                      >
                        Recalcular
                      </button>
                    )}
                  </div>
                  {codigoOverwritten && isEditing && (
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">Se recalculó el código; se sobrescribirá al guardar.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                  <input
                    id="nombre"
                    required
                    type="text"
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    value={formData.nombre}
                    onChange={(e) => { setNombreEdited(true); setFormData({ ...formData, nombre: e.target.value }) }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="hora_inicio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora Inicio</label>
                    <input
                      id="hora_inicio"
                      type="time"
                      className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.hora_inicio}
                      onChange={(e) => { setTimesAuto(false); setFormData({ ...formData, hora_inicio: e.target.value }) }}
                    />
                  </div>
                  <div>
                    <label htmlFor="hora_fin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hora Fin</label>
                    <input
                      id="hora_fin"
                      type="time"
                      className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.hora_fin}
                      onChange={(e) => { setTimesAuto(false); setFormData({ ...formData, hora_fin: e.target.value }) }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Días</label>
                  <div className="flex flex-wrap gap-2">
                    <label className={`inline-flex items-center space-x-2 px-2 py-1 rounded-md ${formData.lunes ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : ''}`}>
                      <input type="checkbox" checked={formData.lunes} onChange={(e) => setFormData({ ...formData, lunes: e.target.checked })} className="h-4 w-4" />
                      <span className="text-sm">Lun</span>
                    </label>
                    <label className={`inline-flex items-center space-x-2 px-2 py-1 rounded-md ${formData.martes ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : ''}`}>
                      <input type="checkbox" checked={formData.martes} onChange={(e) => setFormData({ ...formData, martes: e.target.checked })} className="h-4 w-4" />
                      <span className="text-sm">Mar</span>
                    </label>
                    <label className={`inline-flex items-center space-x-2 px-2 py-1 rounded-md ${formData.miercoles ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : ''}`}>
                      <input type="checkbox" checked={formData.miercoles} onChange={(e) => setFormData({ ...formData, miercoles: e.target.checked })} className="h-4 w-4" />
                      <span className="text-sm">Mié</span>
                    </label>
                    <label className={`inline-flex items-center space-x-2 px-2 py-1 rounded-md ${formData.jueves ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : ''}`}>
                      <input type="checkbox" checked={formData.jueves} onChange={(e) => setFormData({ ...formData, jueves: e.target.checked })} className="h-4 w-4" />
                      <span className="text-sm">Jue</span>
                    </label>
                    <label className={`inline-flex items-center space-x-2 px-2 py-1 rounded-md ${formData.viernes ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : ''}`}>
                      <input type="checkbox" checked={formData.viernes} onChange={(e) => setFormData({ ...formData, viernes: e.target.checked })} className="h-4 w-4" />
                      <span className="text-sm">Vie</span>
                    </label>
                    <label className={`inline-flex items-center space-x-2 px-2 py-1 rounded-md ${formData.sabado ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'opacity-50 cursor-not-allowed'}`}>
                      <input type="checkbox" checked={formData.sabado} disabled className="h-4 w-4" />
                      <span className="text-sm">Sáb</span>
                    </label>
                    <label className={`inline-flex items-center space-x-2 px-2 py-1 rounded-md ${formData.domingo ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300' : 'opacity-50 cursor-not-allowed'}`}>
                      <input type="checkbox" checked={formData.domingo} disabled className="h-4 w-4" />
                      <span className="text-sm">Dom</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de turno</label>
                  <div className="flex items-center gap-4">
                    {['Mañana', 'Tarde', 'Completo'].map((opt) => (
                      <label key={opt} className={`inline-flex items-center px-3 py-2 rounded-md border ${formData.tipo === opt ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600'} cursor-pointer`}>
                        <input type="radio" name="tipo" value={opt} checked={formData.tipo === opt} onChange={(e) => handleTipoChange(e.target.value)} className="mr-2" />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="activo"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
                      checked={!!formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                    />
                    <label htmlFor="activo" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Activo</label>
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
                      {loading ? (isEditing ? 'Actualizando...' : 'Creando...') : (isEditing ? 'Actualizar Turno' : 'Crear Turno')}
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
