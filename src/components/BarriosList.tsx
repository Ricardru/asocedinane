'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'

interface Barrio {
  id: number
  nombre: string
  ciudad_id: number
  ciudades?: { nombre: string; departamentos?: { nombre: string; paises?: { nombre: string } } }
}

interface BarrioFormProps {
  barrio?: Barrio | null
  onSuccess?: () => void
  showButton?: boolean
  initialOpen?: boolean
}

function BarrioForm({ barrio, onSuccess, showButton = true, initialOpen = false }: BarrioFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [ciudades, setCiudades] = useState<any[]>([])
  const [formData, setFormData] = useState({
    nombre: '',
    ciudad_id: '',
  })

  const isEditing = !!barrio

  useEffect(() => {
    if (isOpen) {
      loadCiudades()
    }
  }, [isOpen])

  useEffect(() => {
    if (barrio) {
      setFormData({
        nombre: barrio.nombre,
        ciudad_id: barrio.ciudad_id.toString(),
      })
      setIsOpen(true)
    } else if (initialOpen) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [barrio, initialOpen])

  const loadCiudades = async () => {
    try {
      const { data, error } = await supabase
        .from('ciudades')
        .select(`
          *,
          departamentos (
            nombre,
            paises (
              nombre
            )
          )
        `)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const submitData = {
      nombre: formData.nombre,
      ciudad_id: parseInt(formData.ciudad_id),
    }

    if (isEditing && barrio) {
      const { error } = await supabase
        .from('barrios')
        .update(submitData)
        .eq('id', barrio.id)

      if (error) {
        alert('Error al actualizar barrio: ' + error.message)
      } else {
        setIsOpen(false)
        onSuccess?.()
      }
    } else {
      const { error } = await supabase
        .from('barrios')
        .insert([submitData])

      if (error) {
        alert('Error al crear barrio: ' + error.message)
      } else {
        setIsOpen(false)
        setFormData({ nombre: '', ciudad_id: '' })
        onSuccess?.()
      }
    }

    setLoading(false)
  }

  const closeModal = () => {
    setIsOpen(false)
    if (isEditing) {
      onSuccess?.()
    }
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {isEditing ? 'Editar Barrio' : 'Nuevo Barrio'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="ciudad_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ciudad
                  </label>
                  <select
                    id="ciudad_id"
                    required
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.ciudad_id}
                    onChange={(e) => setFormData({ ...formData, ciudad_id: e.target.value })}
                  >
                    <option value="">Seleccionar ciudad...</option>
                    {ciudades.map((ciudad) => (
                      <option key={ciudad.id} value={ciudad.id}>
                        {ciudad.nombre} - {ciudad.departamentos?.nombre}, {ciudad.departamentos?.paises?.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre del Barrio
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    required
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Ej: Centro"
                  />
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
                    {loading ? (isEditing ? 'Actualizando...' : 'Creando...') : (isEditing ? 'Actualizar Barrio' : 'Crear Barrio')}
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

export function BarriosList() {
  const [barrios, setBarrios] = useState<Barrio[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [ciudadFilter, setCiudadFilter] = useState('')
  const [departamentoFilter, setDepartamentoFilter] = useState('')
  const [paisFilter, setPaisFilter] = useState('')
  const [ciudades, setCiudades] = useState<any[]>([])
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [paises, setPaises] = useState<any[]>([])
  const [editingBarrio, setEditingBarrio] = useState<Barrio | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchBarrios()
    fetchCiudades()
    fetchDepartamentos()
    fetchPaises()
  }, [])

  const fetchPaises = async () => {
    try {
      const { data, error } = await supabase
        .from('paises')
        .select('*')
        .order('nombre')

      if (error) {
        console.warn('Error loading paises:', error.message)
        setPaises([])
      } else {
        setPaises(data || [])
      }
    } catch (err) {
      console.warn('Exception loading paises:', err)
      setPaises([])
    }
  }

  const fetchDepartamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('departamentos')
        .select(`
          *,
          paises (
            nombre
          )
        `)
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

  const fetchCiudades = async () => {
    try {
      const { data, error } = await supabase
        .from('ciudades')
        .select(`
          *,
          departamentos (
            nombre,
            paises (
              nombre
            )
          )
        `)
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

  const fetchBarrios = async () => {
    try {
      const { data, error } = await supabase
        .from('barrios')
        .select(`
          *,
          ciudades (
            nombre,
            departamentos (
              nombre,
              paises (
                nombre
              )
            )
          )
        `)
        .order('nombre')

      if (error) {
        console.error('Error fetching barrios:', error)
        setBarrios([])
      } else {
        setBarrios(data || [])
      }
    } catch (err) {
      console.error('Exception fetching barrios:', err)
      setBarrios([])
    }
    setLoading(false)
  }

  const filteredBarrios = barrios.filter(barrio => {
    const matchesSearch = barrio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         barrio.ciudades?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         barrio.ciudades?.departamentos?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         barrio.ciudades?.departamentos?.paises?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCiudad = !ciudadFilter || barrio.ciudad_id.toString() === ciudadFilter
    const matchesDepartamento = !departamentoFilter || (
      ciudades.find(c => c.id === barrio.ciudad_id)?.departamento_id?.toString() === departamentoFilter
    )
    const matchesPais = !paisFilter || (
      departamentos.find(d => d.id === parseInt(departamentoFilter || '0'))?.pais_id?.toString() === paisFilter
    )
    return matchesSearch && matchesCiudad && matchesDepartamento && matchesPais
  })

  const exportToExcel = () => {
    const dataToExport = filteredBarrios.map(barrio => ({
      'ID': barrio.id,
      'Nombre': barrio.nombre,
      'Ciudad': barrio.ciudades?.nombre || 'No especificado',
      'Departamento': barrio.ciudades?.departamentos?.nombre || 'No especificado',
      'País': barrio.ciudades?.departamentos?.paises?.nombre || 'No especificado',
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Barrios')
    XLSX.writeFile(wb, `barrios_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este barrio?')) return

    const { error } = await supabase
      .from('barrios')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error al eliminar barrio: ' + error.message)
    } else {
      setBarrios(barrios.filter(b => b.id !== id))
    }
  }

  if (loading) return <div className="text-center py-8">Cargando barrios...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#01257D] dark:text-cyan-400">Barrios</h2>
        <div className="flex items-center space-x-4">
          {/* Filtros */}
          <div className="flex space-x-2">
            <select
              value={paisFilter}
              onChange={(e) => {
                setPaisFilter(e.target.value)
                setDepartamentoFilter('')
                setCiudadFilter('')
              }}
              className="block w-28 pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
            >
              <option value="">Todos los países</option>
              {paises.map((pais) => (
                <option key={pais.id} value={pais.id}>
                  {pais.nombre}
                </option>
              ))}
            </select>

            <select
              value={departamentoFilter}
              onChange={(e) => {
                setDepartamentoFilter(e.target.value)
                setCiudadFilter('')
              }}
              className="block w-32 pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
            >
              <option value="">Todos los deptos</option>
              {departamentos
                .filter(depto => !paisFilter || depto.pais_id.toString() === paisFilter)
                .map((depto) => (
                <option key={depto.id} value={depto.id}>
                  {depto.nombre}
                </option>
              ))}
            </select>

            <select
              value={ciudadFilter}
              onChange={(e) => setCiudadFilter(e.target.value)}
              className="block w-32 pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
            >
              <option value="">Todas las ciudades</option>
              {ciudades
                .filter(ciudad => !departamentoFilter || ciudad.departamento_id.toString() === departamentoFilter)
                .map((ciudad) => (
                <option key={ciudad.id} value={ciudad.id}>
                  {ciudad.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Caja de búsqueda */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar barrios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-64 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Botones de exportación */}
          <button
            onClick={exportToExcel}
            className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
            title="Exportar a Excel"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Excel</span>
          </button>

          <BarrioForm onSuccess={fetchBarrios} />
        </div>
      </div>

      {/* Vista de tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Tarjeta de agregar barrio */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg shadow-md p-6 border-2 border-dashed border-orange-300 dark:border-orange-600 flex items-center justify-center cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors" onClick={() => setShowCreateForm(true)} title="Agregar nuevo barrio">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto mb-4 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-lg font-semibold text-orange-600 dark:text-orange-400">Agregar Nuevo Barrio</span>
          </div>
        </div>

        {filteredBarrios.map((barrio) => (
          <div key={barrio.id} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
            <div className="absolute top-2 right-2 flex space-x-1 z-10">
              <button
                onClick={() => setEditingBarrio(barrio)}
                className="p-1.5 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                title="Editar barrio"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => handleDelete(barrio.id)}
                className="p-1.5 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                title="Eliminar barrio"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>

            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-[#01257D] dark:bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                🏘️
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{barrio.nombre}</h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">ID: {barrio.id}</span>
              </div>
            </div>

            <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
              <p><strong>Ciudad:</strong> {barrio.ciudades?.nombre || 'No especificado'}</p>
              <p><strong>Depto:</strong> {barrio.ciudades?.departamentos?.nombre || 'No especificado'}</p>
              <p><strong>País:</strong> {barrio.ciudades?.departamentos?.paises?.nombre || 'No especificado'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Formulario de edición */}
      {editingBarrio && (
        <BarrioForm
          barrio={editingBarrio}
          onSuccess={() => {
            setEditingBarrio(null)
            fetchBarrios()
          }}
        />
      )}

      {/* Formulario de creación */}
      {showCreateForm && (
        <BarrioForm
          showButton={false}
          initialOpen={true}
          onSuccess={() => {
            setShowCreateForm(false)
            fetchBarrios()
          }}
        />
      )}
    </div>
  )
}