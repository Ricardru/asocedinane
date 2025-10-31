'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface PersonaFormProps {
  persona?: Persona | null
  onSuccess?: () => void
  showButton?: boolean
  initialOpen?: boolean
}

interface Persona {
  id: string
  nombre_completo: string
  identificacion: string
  tipo_identificacion: string
  telefono: string
  email: string
  direccion: string
  activo: boolean
  pais_id?: number
  departamento_id?: number
  ciudad_id?: number
  barrio_id?: number
  fec_nacimiento?: string
  sexo?: string
  nacionalidad_id?: number
}

export function PersonaForm({ persona, onSuccess, showButton = true, initialOpen = false }: PersonaFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [paises, setPaises] = useState<any[]>([])
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [ciudades, setCiudades] = useState<any[]>([])
  const [barrios, setBarrios] = useState<any[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [formData, setFormData] = useState({
    nombre_completo: '',
    identificacion: '',
    tipo_identificacion: 'cedula',
    telefono: '',
    email: '',
    direccion: '',
    activo: true,
    pais_id: '',
    departamento_id: '',
    ciudad_id: '',
    barrio_id: '',
    fec_nacimiento: '',
    sexo: '',
    nacionalidad_id: '',
  })

  const isEditing = !!persona

  const closeModal = () => {
    setIsOpen(false)
    if (isEditing) {
      // Si estamos editando, llamar onSuccess para resetear el estado de edición
      onSuccess?.()
    }
  }

  useEffect(() => {
    if (persona) {
      console.log('PersonaForm recibió persona para editar:', persona.nombre_completo, persona)
      // Limpiar estados anteriores
      setDepartamentos([])
      setCiudades([])
      setBarrios([])

  const paisId = persona.pais_id?.toString() || ''
  const departamentoId = persona.departamento_id?.toString() || ''
  const ciudadId = persona.ciudad_id?.toString() || ''
  const barrioId = persona.barrio_id?.toString() || ''
  const nacionalidadId = persona.nacionalidad_id?.toString() || ''
  const fecNacimiento = persona.fec_nacimiento || ''
  const sexoVal = persona.sexo || ''

      setFormData({
        nombre_completo: persona.nombre_completo ?? '',
        identificacion: persona.identificacion ?? '',
        tipo_identificacion: persona.tipo_identificacion ?? 'cedula',
        telefono: persona.telefono ?? '',
        email: persona.email ?? '',
        direccion: persona.direccion ?? '',
        activo: persona.activo ?? true,
        pais_id: paisId,
        departamento_id: departamentoId,
        ciudad_id: ciudadId,
        barrio_id: barrioId,
        nacionalidad_id: nacionalidadId,
        fec_nacimiento: fecNacimiento ?? '',
        sexo: sexoVal ?? '',
      })

      // preview if foto_path exists
      // preview if foto_path exists
      const fotoPath = (persona as any).foto_path
      if ((persona as any).foto_public_url) {
        // If the parent already computed a usable public or signed URL, use it.
        setPreviewUrl((persona as any).foto_public_url)
      } else if (fotoPath) {
        // Try to generate a signed URL as fallback (works even if bucket is private).
        ;(async () => {
          try {
            const { data: signedData, error: signedErr } = await supabase.storage.from('personas-photos').createSignedUrl(fotoPath, 60)
            if (!signedErr && signedData && (signedData as any).signedUrl) {
              setPreviewUrl((signedData as any).signedUrl)
              return
            }
          } catch (e) {
            // ignore and fallback to publicUrl
            console.warn('createSignedUrl error in PersonaForm:', e)
          }

          try {
            const publicUrl = supabase.storage.from('personas-photos').getPublicUrl(fotoPath).data.publicUrl
            setPreviewUrl(publicUrl)
          } catch (e) {
            setPreviewUrl(null)
          }
        })()
      } else {
        setPreviewUrl(null)
      }

      // Cargar las dependencias de ubicación si existen
      if (paisId) {
        loadDepartamentos(paisId).then(() => {
          if (departamentoId) {
            loadCiudades(departamentoId).then(() => {
              if (ciudadId) {
                loadBarrios(ciudadId)
              }
            })
          }
        })
      }

      setIsOpen(true)
    } else if (initialOpen) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [persona, initialOpen])

  // Cargar países al abrir el modal
  useEffect(() => {
    if (isOpen) {
      loadPaises()
    }
  }, [isOpen])

  const loadPaises = async () => {
    try {
      const { data, error } = await supabase
        .from('paises')
        .select('*')
        .order('nombre')

      if (error) {
        console.warn('Error loading paises (table may not exist yet):', error.message)
        setPaises([])
      } else {
        setPaises(data || [])
      }
    } catch (err) {
      console.warn('Exception loading paises:', err)
      setPaises([])
    }
  }

  const loadDepartamentos = async (paisId: string) => {
    try {
      const { data, error } = await supabase
        .from('departamentos')
        .select('*')
        .eq('pais_id', parseInt(paisId))
        .order('nombre')

      if (error) {
        console.warn('Error loading departamentos:', error.message)
        setDepartamentos([])
      } else {
        setDepartamentos(data || [])
      }
    } catch (err) {
      console.warn('Exception loading departamentos:', err)
      setDepartamentos([])
    }
  }

  const loadCiudades = async (departamentoId: string) => {
    try {
      const { data, error } = await supabase
        .from('ciudades')
        .select('*')
        .eq('departamento_id', parseInt(departamentoId))
        .order('nombre')

      if (error) {
        console.warn('Error loading ciudades:', error.message)
        setCiudades([])
      } else {
        setCiudades(data || [])
      }
    } catch (err) {
      console.warn('Exception loading ciudades:', err)
      setCiudades([])
    }
  }

  const loadBarrios = async (ciudadId: string) => {
    try {
      const { data, error } = await supabase
        .from('barrios')
        .select('*')
        .eq('ciudad_id', parseInt(ciudadId))
        .order('nombre')

      if (error) {
        console.warn('Error loading barrios:', error.message)
        setBarrios([])
      } else {
        setBarrios(data || [])
      }
    } catch (err) {
      console.warn('Exception loading barrios:', err)
      setBarrios([])
    }
  }

  const handlePaisChange = (paisId: string) => {
    setFormData({
      ...formData,
      pais_id: paisId,
      departamento_id: '',
      ciudad_id: '',
      barrio_id: ''
    })
    setDepartamentos([])
    setCiudades([])
    setBarrios([])
    if (paisId) {
      loadDepartamentos(paisId)
    }
  }

  const handleDepartamentoChange = (departamentoId: string) => {
    setFormData({
      ...formData,
      departamento_id: departamentoId,
      ciudad_id: '',
      barrio_id: ''
    })
    setCiudades([])
    setBarrios([])
    if (departamentoId) {
      loadCiudades(departamentoId)
    }
  }

  const handleCiudadChange = (ciudadId: string) => {
    setFormData({
      ...formData,
      ciudad_id: ciudadId,
      barrio_id: ''
    })
    setBarrios([])
    if (ciudadId) {
      loadBarrios(ciudadId)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const submitData = {
      nombre_completo: formData.nombre_completo,
      identificacion: formData.identificacion,
      tipo_identificacion: formData.tipo_identificacion,
      telefono: formData.telefono,
      email: formData.email,
      direccion: formData.direccion,
      activo: formData.activo,
      pais_id: formData.pais_id ? parseInt(formData.pais_id) : null,
      departamento_id: formData.departamento_id ? parseInt(formData.departamento_id) : null,
      ciudad_id: formData.ciudad_id ? parseInt(formData.ciudad_id) : null,
      barrio_id: formData.barrio_id ? parseInt(formData.barrio_id) : null,
      fec_nacimiento: formData.fec_nacimiento || null,
      sexo: formData.sexo || null,
      nacionalidad_id: formData.nacionalidad_id ? parseInt(formData.nacionalidad_id) : null,
    }

    if (isEditing && persona) {
      const { error } = await supabase
        .from('personas')
        .update(submitData)
        .eq('id', persona.id)

      if (error) {
        alert('Error al actualizar persona: ' + error.message)
      } else {
        // si hay un archivo seleccionado, subirlo y actualizar foto_path
        if (selectedFile) {
          try {
            setUploading(true)
            const ext = selectedFile.name.split('.').pop()
            const filename = `personas/${persona.id}/${crypto.randomUUID()}.${ext}`
            const { error: uploadError } = await supabase.storage.from('personas-photos').upload(filename, selectedFile, { upsert: true })
            if (uploadError) throw uploadError
            await supabase.from('personas').update({ foto_path: filename }).eq('id', persona.id)
            const publicUrl = supabase.storage.from('personas-photos').getPublicUrl(filename).data.publicUrl
            setPreviewUrl(publicUrl)
          } catch (uErr: any) {
            console.error('Error subiendo foto:', uErr)
            alert('Error subiendo la foto: ' + (uErr?.message || uErr))
          } finally {
            setUploading(false)
          }
        }
        closeModal()
      }
    } else {
      const { data: insertData, error } = await supabase
        .from('personas')
        .insert([submitData])
        .select('*')

      if (error || !insertData || insertData.length === 0) {
        alert('Error al crear persona: ' + (error?.message || 'unknown'))
      } else {
        const newPersona = insertData[0]
        // si hay archivo seleccionado, subirlo y actualizar photo path
        if (selectedFile) {
          try {
            setUploading(true)
            const ext = selectedFile.name.split('.').pop()
            const filename = `personas/${newPersona.id}/${crypto.randomUUID()}.${ext}`
            const { error: uploadError } = await supabase.storage.from('personas-photos').upload(filename, selectedFile, { upsert: true })
            if (uploadError) throw uploadError
            await supabase.from('personas').update({ foto_path: filename }).eq('id', newPersona.id)
            const publicUrl = supabase.storage.from('personas-photos').getPublicUrl(filename).data.publicUrl
            setPreviewUrl(publicUrl)
          } catch (uErr: any) {
            console.error('Error subiendo foto:', uErr)
            alert('Error subiendo la foto: ' + (uErr?.message || uErr))
          } finally {
            setUploading(false)
          }
        }

        setIsOpen(false)
        setFormData({
          nombre_completo: '',
          identificacion: '',
          tipo_identificacion: 'cedula',
          telefono: '',
          email: '',
          direccion: '',
          activo: true,
          pais_id: '',
          departamento_id: '',
          ciudad_id: '',
          barrio_id: '',
          nacionalidad_id: '',
          fec_nacimiento: '',
          sexo: '',
        })
        onSuccess?.()
      }
    }

    setLoading(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    if (!file) {
      setSelectedFile(null)
      setPreviewUrl(null)
      return
    }
    // Validaciones simples
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen.')
      return
    }
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      alert('La imagen supera el tamaño máximo de 5MB.')
      return
    }
    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  // Liberar object URL temporal cuando cambie previewUrl
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(previewUrl) } catch (e) { /* ignore */ }
      }
    }
  }, [previewUrl])

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
        <div className="fixed inset-0 bg-black bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[800px] max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{isEditing ? 'Editar Persona' : 'Nueva Persona'}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Primera fila: Nombre completo */}
                <div>
                  <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    id="nombre_completo"
                    required
                    className="mt-1 block w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                  />
                </div>

                {/* Foto de persona */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Foto (Opcional)</label>
                  <div className="mt-2 flex items-center space-x-4">
                    <div className="relative">
                      {/* Hidden file input, triggered by clicking the preview box */}
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden hover:border-indigo-500 transition-colors relative"
                        title="Seleccionar foto"
                        aria-label="Seleccionar foto"
                      >
                        {previewUrl ? (
                          // show preview (object URL or public url)
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center text-sm text-gray-500 dark:text-gray-300">
                            <svg className="w-6 h-6 mb-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12v6m0-6l-3 3m3-3l3 3M7 8l3-3m0 0a4 4 0 015.657 0L17 8" />
                            </svg>
                            <span className="text-xs">Subir foto</span>
                          </div>
                        )}
                        {/* overlay edit text */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 flex items-end justify-center text-white text-xs opacity-0 hover:opacity-100 transition-opacity">
                          <div className="w-full text-center py-1 bg-black bg-opacity-40">Cambiar</div>
                        </div>
                      </button>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm">Seleccionar archivo</button>
                        {uploading && <div className="text-sm text-gray-500">Subiendo foto...</div>}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Max 5MB. Tipos: jpg, png, webp.</div>
                    </div>
                  </div>
                </div>

                {/* Segunda fila: Tipo ID e Identificación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="tipo_identificacion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tipo de Identificación
                    </label>
                    <select
                      id="tipo_identificacion"
                      className="mt-1 block w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                      className="mt-1 block w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-300"
                      value={formData.identificacion}
                      onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                    />
                  </div>
                </div>

                {/* Tercera fila: Teléfono y Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      id="telefono"
                      className="mt-1 block w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-300"
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
                      className="mt-1 block w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-300"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                {/* Cuarta fila: Dirección (ancho completo) */}
                <div>
                  <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dirección
                  </label>
                  <textarea
                    id="direccion"
                    rows={3}
                    className="mt-1 block w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-300"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </div>

                {/* Campos de ubicación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="pais_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      País
                    </label>
                    <select
                      id="pais_id"
                      className="mt-1 block w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.pais_id}
                      onChange={(e) => handlePaisChange(e.target.value)}
                    >
                      <option value="">Seleccionar país...</option>
                      {paises.map((pais) => (
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
                      className="mt-1 block w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.departamento_id}
                      onChange={(e) => handleDepartamentoChange(e.target.value)}
                      disabled={!formData.pais_id}
                    >
                      <option value="">Seleccionar departamento...</option>
                      {departamentos.map((departamento) => (
                        <option key={departamento.id} value={departamento.id}>
                          {departamento.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="ciudad_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ciudad
                    </label>
                    <select
                      id="ciudad_id"
                      className="mt-1 block w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.ciudad_id}
                      onChange={(e) => handleCiudadChange(e.target.value)}
                      disabled={!formData.departamento_id}
                    >
                      <option value="">Seleccionar ciudad...</option>
                      {ciudades.map((ciudad) => (
                        <option key={ciudad.id} value={ciudad.id}>
                          {ciudad.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="barrio_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Barrio (Opcional)
                    </label>
                    <select
                      id="barrio_id"
                      className="mt-1 block w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.barrio_id}
                      onChange={(e) => setFormData({ ...formData, barrio_id: e.target.value })}
                      disabled={!formData.ciudad_id}
                    >
                      <option value="">Seleccionar barrio...</option>
                      {barrios.map((barrio) => (
                        <option key={barrio.id} value={barrio.id}>
                          {barrio.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Nuevos campos: Fecha de nacimiento, Sexo, Nacionalidad */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="fec_nacimiento" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      id="fec_nacimiento"
                      className="mt-1 block w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.fec_nacimiento}
                      onChange={(e) => setFormData({ ...formData, fec_nacimiento: e.target.value })}
                    />
                  </div>

                  <div>
                    <label htmlFor="sexo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sexo
                    </label>
                    <select
                      id="sexo"
                      className="mt-1 block w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.sexo}
                      onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Mujer">Mujer</option>
                      <option value="Varon">Varon</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="nacionalidad_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nacionalidad
                    </label>
                    <select
                      id="nacionalidad_id"
                      className="mt-1 block w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.nacionalidad_id}
                      onChange={(e) => setFormData({ ...formData, nacionalidad_id: e.target.value })}
                    >
                      <option value="">Seleccionar nacionalidad...</option>
                      {paises.map((pais) => (
                        <option key={pais.id} value={pais.id}>
                          {pais.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
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
                      {loading ? (isEditing ? 'Actualizando...' : 'Creando...') : (isEditing ? 'Actualizar Persona' : 'Crear Persona')}
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