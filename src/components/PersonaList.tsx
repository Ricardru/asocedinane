'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PersonaForm } from './PersonaForm'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Persona {
  id: string
  nombre_completo: string
  identificacion: string
  tipo_identificacion: string
  telefono: string
  email: string
  direccion: string
  activo: boolean
  fec_nacimiento?: string
  edad?: number
  foto_path?: string
  foto_public_url?: string
  foto_broken?: boolean
  pais_id?: number
  departamento_id?: number
  ciudad_id?: number
  barrio_id?: number
  paises?: { nombre: string }
  departamentos?: { nombre: string }
  ciudades?: { nombre: string }
  barrios?: { nombre: string }
}

export function PersonaList() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({})
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null)
  const [viewingPersona, setViewingPersona] = useState<Persona | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [lastDebug, setLastDebug] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  // Merge helper to avoid duplicate IDs when concatenating paginated results
  const mergeUnique = (prev: Persona[], next: Persona[]) => {
    const map = new Map<string, Persona>()
    // preserve previous order
    for (const p of prev) map.set(p.id, p)
    // append only new ids
    for (const p of next) {
      if (!map.has(p.id)) map.set(p.id, p)
    }
    return Array.from(map.values())
  }

  const handleImageError = (id: string, url?: string) => {
    console.warn('[PersonaList] image failed to load for', id, url)
    setBrokenImages(prev => ({ ...prev, [id]: true }))
  }

  const clearImageError = (id: string) => {
    setBrokenImages(prev => {
      if (!prev[id]) return prev
      const copy = { ...prev }
      delete copy[id]
      return copy
    })
  }

  // Ensure foto_path is present: if missing, fetch from personas table in batch
  const ensureFotoPaths = async (items: any[]) => {
    const missing = items.filter((p) => !p.foto_path).map((p) => p.id)
    if (missing.length === 0) return items
    try {
      const { data: fotos, error } = await supabase.from('personas').select('id, foto_path').in('id', missing)
      if (!error && fotos) {
        const map = new Map(fotos.map((f: any) => [f.id, f.foto_path]))
        const itemsWithPaths = items.map((p) => ({ ...p, foto_path: p.foto_path ?? map.get(p.id) }))
        // also compute public url for convenience to avoid calling getPublicUrl in render
        // For each persona, compute public URL and quickly validate it with a HEAD request
        return await Promise.all(itemsWithPaths.map(async (p) => {
          try {
            if (p.foto_path) {
              const publicUrl = supabase.storage.from('personas-photos').getPublicUrl(p.foto_path).data.publicUrl
              // Log the computed public URL for easier debugging in case the image looks "dañada"
              console.debug('[PersonaList] publicUrl for', p.id, publicUrl)

              // Try a HEAD request to validate the resource exists and is an image.
              // Note: this can be blocked by CORS on some Supabase configs; handle errors gracefully.
              try {
                // Some Supabase storage configurations reject HEAD requests or return JSON errors.
                // Use a lightweight GET with Range to avoid downloading full image.
                const res = await fetch(publicUrl, { method: 'GET', headers: { Range: 'bytes=0-0' } })
                const contentType = res.headers.get('content-type') || ''
                if (!res.ok || !contentType.startsWith('image')) {
                  console.warn('[PersonaList] publicUrl GET check failed for', p.id, res.status, contentType)
                  // Try to get a signed URL as a fallback (useful if bucket is private)
                  try {
                    const { data: signedData, error: signedErr } = await supabase.storage.from('personas-photos').createSignedUrl(p.foto_path, 60)
                    if (!signedErr && signedData && (signedData as any).signedUrl) {
                      const signedUrl = (signedData as any).signedUrl
                      console.debug('[PersonaList] using signedUrl for', p.id, signedUrl)
                      // clear broken flag
                      setBrokenImages(prev => {
                        if (!prev[p.id]) return prev
                        const copy = { ...prev }
                        delete copy[p.id]
                        return copy
                      })
                      return { ...p, foto_public_url: signedUrl }
                    }
                  } catch (signedErr) {
                    console.warn('[PersonaList] createSignedUrl error for', p.id, signedErr)
                  }
                  // mark as broken so UI shows fallback but keep publicUrl for manual checks
                  setBrokenImages(prev => ({ ...prev, [p.id]: true }))
                  return { ...p, foto_public_url: publicUrl }
                }
                // ok
                // ensure we clear any previous broken mark
                setBrokenImages(prev => {
                  if (!prev[p.id]) return prev
                  const copy = { ...prev }
                  delete copy[p.id]
                  return copy
                })
                return { ...p, foto_public_url: publicUrl }
              } catch (getErr) {
                // Could be CORS or network; attempt signed URL fallback
                console.warn('[PersonaList] GET request error for', p.id, getErr)
                try {
                  const { data: signedData, error: signedErr } = await supabase.storage.from('personas-photos').createSignedUrl(p.foto_path, 60)
                  if (!signedErr && signedData && (signedData as any).signedUrl) {
                    const signedUrl = (signedData as any).signedUrl
                    console.debug('[PersonaList] using signedUrl after GET error for', p.id, signedUrl)
                    setBrokenImages(prev => {
                      if (!prev[p.id]) return prev
                      const copy = { ...prev }
                      delete copy[p.id]
                      return copy
                    })
                    return { ...p, foto_public_url: signedUrl }
                  }
                } catch (signedErr) {
                  console.warn('[PersonaList] createSignedUrl error for', p.id, signedErr)
                }
                setBrokenImages(prev => ({ ...prev, [p.id]: true }))
                return { ...p, foto_public_url: publicUrl }
              }
            }
          } catch (e) {
            // ignore
          }
          return p
        }))
      }
    } catch (e) {
      console.warn('Error fetching foto_path for personas:', e)
    }
    return items
  }

  useEffect(() => {
    // carga inicial (primer página)
    fetchPersonas(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchPersonas = async (pageToLoad: number = 0) => {
    const from = pageToLoad * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    try {
      const dbg = `[PersonaList] fetchPersonas: iniciando página=${pageToLoad} range=${from}-${to}`
      console.debug(dbg)
      setLastDebug(dbg)

      // Primero intentar leer desde la view que ya calcula la edad
      const { data: viewData, error: viewError } = await supabase
        .from('personas_con_edad')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to)

      const viewResDbg = `[PersonaList] view fetch result: error=${!!viewError} count=${Array.isArray(viewData) ? viewData.length : 0}`
      console.debug(viewResDbg, { viewError, count: Array.isArray(viewData) ? viewData.length : 0 })
      setLastDebug(viewResDbg)

      let usedView = false
      if (!viewError && Array.isArray(viewData)) {
        // Si la cantidad devuelta es menor al page size, no hay más
        if (viewData.length < PAGE_SIZE) setHasMore(false)
        // La view devuelve edad directamente
        let personasWithUbicacion = await Promise.all(
          viewData.map(async (persona) => {
            try {
              // Intentar cargar ubicación si las columnas existen
              if (persona.pais_id) {
                const [paisRes, deptRes, ciudadRes, barrioRes] = await Promise.all([
                  persona.pais_id ? supabase.from('paises').select('nombre').eq('id', persona.pais_id).single() : Promise.resolve({ data: null }),
                  persona.departamento_id ? supabase.from('departamentos').select('nombre').eq('id', persona.departamento_id).single() : Promise.resolve({ data: null }),
                  persona.ciudad_id ? supabase.from('ciudades').select('nombre').eq('id', persona.ciudad_id).single() : Promise.resolve({ data: null }),
                  persona.barrio_id ? supabase.from('barrios').select('nombre').eq('id', persona.barrio_id).single() : Promise.resolve({ data: null }),
                ])

                return {
                  ...persona,
                  paises: paisRes.data ? { nombre: paisRes.data.nombre } : undefined,
                  departamentos: deptRes.data ? { nombre: deptRes.data.nombre } : undefined,
                  ciudades: ciudadRes.data ? { nombre: ciudadRes.data.nombre } : undefined,
                  barrios: barrioRes.data ? { nombre: barrioRes.data.nombre } : undefined,
                }
              }
              return persona
            } catch (ubicacionError) {
              console.warn('Error loading ubicación for persona:', persona.id, ubicacionError)
              return persona
            }
          })
    )
    // Ensure foto_path is present (view may not include it)
    personasWithUbicacion = await ensureFotoPaths(personasWithUbicacion)
    setPersonas(prev => pageToLoad === 0 ? personasWithUbicacion : mergeUnique(prev, personasWithUbicacion))
        const usedViewDbg = `[PersonaList] usando datos desde view personas_con_edad página=${pageToLoad}`
        console.debug(usedViewDbg)
        setLastDebug(usedViewDbg)
        usedView = true
      }
      // Si la view no existe o está vacía, usar la tabla 'personas' y calcular edad localmente
      if (!usedView) {
        const { data, error } = await supabase
          .from('personas')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to)

        if (error) {
          const errDbg = '[PersonaList] Error fetching personas from table:'
          console.error(errDbg, error)
          setLastDebug(errDbg + ' ' + (error?.message ?? ''))
          setPersonas([])
        } else {
          const dataDbg = `[PersonaList] datos obtenidos desde tabla personas, count=${Array.isArray(data) ? data.length : 0} página=${pageToLoad}`
          console.debug(dataDbg)
          setLastDebug(dataDbg)
          // Si la cantidad devuelta es menor al page size, no hay más
          if (data.length < PAGE_SIZE) setHasMore(false)
          // Si la consulta básica funciona, intentar cargar con ubicación
          let personasWithUbicacion = await Promise.all(
            data.map(async (persona) => {
              try {
                // Intentar cargar ubicación si las columnas existen
                if (persona.pais_id) {
                  const [paisRes, deptRes, ciudadRes, barrioRes] = await Promise.all([
                    persona.pais_id ? supabase.from('paises').select('nombre').eq('id', persona.pais_id).single() : Promise.resolve({ data: null }),
                    persona.departamento_id ? supabase.from('departamentos').select('nombre').eq('id', persona.departamento_id).single() : Promise.resolve({ data: null }),
                    persona.ciudad_id ? supabase.from('ciudades').select('nombre').eq('id', persona.ciudad_id).single() : Promise.resolve({ data: null }),
                    persona.barrio_id ? supabase.from('barrios').select('nombre').eq('id', persona.barrio_id).single() : Promise.resolve({ data: null }),
                  ])

                  return {
                    ...persona,
                    paises: paisRes.data ? { nombre: paisRes.data.nombre } : undefined,
                    departamentos: deptRes.data ? { nombre: deptRes.data.nombre } : undefined,
                    ciudades: ciudadRes.data ? { nombre: ciudadRes.data.nombre } : undefined,
                    barrios: barrioRes.data ? { nombre: barrioRes.data.nombre } : undefined,
                  }
                }
                return persona
              } catch (ubicacionError) {
                console.warn('Error loading ubicación for persona:', persona.id, ubicacionError)
                return persona
              }
            })
          )
            // Ensure foto_path is present (in case view omitted it)
            personasWithUbicacion = await ensureFotoPaths(personasWithUbicacion)
            setPersonas(prev => pageToLoad === 0 ? personasWithUbicacion : mergeUnique(prev, personasWithUbicacion))
        }
      }
    } catch (err) {
      console.error('Exception fetching personas:', err)
      setPersonas([])
    }
    setLoading(false)
    setLoadingMore(false)
  }

  // Helper: si no hay campo edad, calcularlo a partir de fec_nacimiento
  const calcularEdad = (fec?: string | null) => {
    if (!fec) return undefined
    try {
      const nacimiento = new Date(fec)
      if (isNaN(nacimiento.getTime())) return undefined
      const hoy = new Date()
      let edad = hoy.getFullYear() - nacimiento.getFullYear()
      const m = hoy.getMonth() - nacimiento.getMonth()
      if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--
      }
      return edad
    } catch (e) {
      return undefined
    }
  }

  // Cargar más páginas
  const loadMore = () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const next = page + 1
    fetchPersonas(next).then(() => setPage(next)).catch(() => setLoadingMore(false))
  }

  // IntersectionObserver para cargar más automáticamente
  const sentinelRef = (node: HTMLDivElement | null) => {
    if (!node) return
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && hasMore && !loadingMore) {
          loadMore()
        }
      })
    }, { root: null, rootMargin: '200px', threshold: 0.1 })
    observer.observe(node)
  }

  // Funciones helper para obtener datos de ubicación
  const getUbicacion = (persona: Persona) => {
    const partes = []
    if (persona.paises?.nombre) partes.push(persona.paises.nombre)
    if (persona.departamentos?.nombre) partes.push(persona.departamentos.nombre)
    if (persona.ciudades?.nombre) partes.push(persona.ciudades.nombre)
    if (persona.barrios?.nombre) partes.push(persona.barrios.nombre)
    return partes.join(', ') || 'Sin ubicación especificada'
  }
  const filteredPersonas = personas.filter(persona =>
    persona.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    persona.identificacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    persona.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    persona.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    persona.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Función para exportar a Excel
  const exportToExcel = () => {
    const dataToExport = filteredPersonas.map(persona => ({
      'Nombre Completo': persona.nombre_completo,
      'Tipo ID': persona.tipo_identificacion,
      'Identificación': persona.identificacion,
      'Email': persona.email || 'No especificado',
      'Teléfono': persona.telefono || 'No especificado',
      'Dirección': persona.direccion || 'No especificada',
      'País': persona.paises?.nombre || 'No especificado',
      'Departamento': persona.departamentos?.nombre || 'No especificado',
      'Ciudad': persona.ciudades?.nombre || 'No especificado',
      'Barrio': persona.barrios?.nombre || 'No especificado',
      'Estado': persona.activo ? 'Activo' : 'Inactivo'
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Personas')
    XLSX.writeFile(wb, `personas_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Función para exportar a PDF
  const exportToPDF = () => {
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text('Listado de Personas', 14, 22)

    // Fecha
    doc.setFontSize(11)
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 32)

    // Datos de la tabla
    const tableData = filteredPersonas.map(persona => [
      persona.nombre_completo,
      `${persona.tipo_identificacion}: ${persona.identificacion}`,
      persona.email || 'No especificado',
      persona.telefono || 'No especificado',
      persona.direccion || 'No especificada',
      persona.paises?.nombre || 'No especificado',
      persona.departamentos?.nombre || 'No especificado',
      persona.ciudades?.nombre || 'No especificado',
      persona.barrios?.nombre || 'No especificado',
      persona.activo ? 'Activo' : 'Inactivo'
    ])

    autoTable(doc, {
      head: [['Nombre Completo', 'Identificación', 'Email', 'Teléfono', 'Dirección', 'País', 'Departamento', 'Ciudad', 'Barrio', 'Estado']],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [1, 39, 125], // Color azul similar al tema
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    })

    doc.save(`personas_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  // Función para imprimir
  const printList = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const htmlContent = `
      <html>
        <head>
          <title>Listado de Personas</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #01257D; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #01257D; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 20px; }
            .date { text-align: right; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Listado de Personas</h1>
          </div>
          <div class="date">
            Fecha: ${new Date().toLocaleDateString()}
          </div>
          <table>
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Identificación</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Ubicación</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPersonas.map(persona => `
                <tr>
                  <td>${persona.nombre_completo}</td>
                  <td>${persona.tipo_identificacion}: ${persona.identificacion}</td>
                  <td>${persona.email || 'No especificado'}</td>
                  <td>${persona.telefono || 'No especificado'}</td>
                  <td>${persona.direccion || 'No especificada'}</td>
                  <td>${getUbicacion(persona)}</td>
                  <td>${persona.activo ? 'Activo' : 'Inactivo'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.print()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta persona?')) return

    const { error } = await supabase
      .from('personas')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error al eliminar persona: ' + error.message)
    } else {
      setPersonas(personas.filter(p => p.id !== id))
    }
  }

  if (loading) return <div>Cargando...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#01257D] dark:text-cyan-400">Personas</h2>
        <div className="flex items-center space-x-4">
          {/* Caja de búsqueda */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar personas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-64 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Botones para alternar vista */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-gray-600 text-[#01257D] dark:text-cyan-400 shadow-sm border border-gray-200 dark:border-gray-500'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
              title="Vista de lista"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-gray-600 text-[#01257D] dark:text-cyan-400 shadow-sm border border-gray-200 dark:border-gray-500'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
              title="Vista de tarjetas"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </button>
          </div>

          {/* Botones de exportación */}
          <div className="flex space-x-2">
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
            <button
              onClick={exportToPDF}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
              title="Exportar a PDF"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>PDF</span>
            </button>
            <button
              onClick={printList}
              className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1"
              title="Imprimir listado"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
          </div>

          <PersonaForm onSuccess={fetchPersonas} />
        </div>
      </div>

      {viewMode === 'list' ? (
        /* Vista de Lista */
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Tarjeta de agregar persona */}
            <li className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500">
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center py-8 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                title="Agregar nueva persona"
              >
                <svg className="w-12 h-12 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-xl font-semibold">Agregar Nueva Persona</span>
              </button>
            </li>
            {filteredPersonas.map((persona) => (
        <li key={persona.id} className="relative px-6 py-4 min-h-[140px]">
          <div className="absolute bottom-3 right-3 flex space-x-2 z-10">
                  <button
                    onClick={() => setViewingPersona(persona)}
                    className="p-2 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                    title="Ver detalles"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      console.log('Editando persona:', persona)
                      setEditingPersona(persona)
                    }}
                    className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                    title="Editar persona"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
                <div className="pr-20">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{persona.nombre_completo}</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {persona.tipo_identificacion}: {persona.identificacion}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{persona.email}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{persona.telefono}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{persona.direccion}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">Edad: {persona.edad ?? (calcularEdad((persona as any).fec_nacimiento) ?? 'N/E')}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">Ubicación: {getUbicacion(persona)}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">Activo: {persona.activo ? 'Sí' : 'No'}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        /* Vista de Tarjetas */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tarjeta de agregar persona */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-md p-6 border-2 border-dashed border-blue-300 dark:border-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" onClick={() => setShowCreateForm(true)} title="Agregar nueva persona">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">Agregar Nueva Persona</span>
            </div>
          </div>
          {filteredPersonas.map((persona) => (
            <div key={persona.id} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 min-h-[240px]">
              <div className="absolute bottom-3 right-3 flex space-x-2 z-10">
                <button
                  onClick={() => setViewingPersona(persona)}
                  className="p-2 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                  title="Ver detalles"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => setEditingPersona(persona)}
                  className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  title="Editar persona"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {brokenImages[persona.id] ? (
                    <div className="w-12 h-12 bg-[#01257D] dark:bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {persona.nombre_completo.charAt(0).toUpperCase()}
                    </div>
                  ) : persona.foto_public_url ? (
                    <img
                      src={persona.foto_public_url}
                      alt={persona.nombre_completo}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={() => handleImageError(persona.id, persona.foto_public_url)}
                      onLoad={() => clearImageError(persona.id)}
                    />
                  ) : persona.foto_path ? (
                    <img
                      src={supabase.storage.from('personas-photos').getPublicUrl(persona.foto_path).data.publicUrl}
                      alt={persona.nombre_completo}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={() => handleImageError(persona.id, persona.foto_path)}
                      onLoad={() => clearImageError(persona.id)}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-[#01257D] dark:bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {persona.nombre_completo.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{persona.nombre_completo}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      persona.activo ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {persona.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium w-20">ID:</span>
                  <span>{persona.tipo_identificacion}: {persona.identificacion}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium w-20">Email:</span>
                  <span>{persona.email || 'No especificado'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium w-20">Teléfono:</span>
                  <span>{persona.telefono || 'No especificado'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium w-20">Edad:</span>
                  <span>{persona.edad ?? (calcularEdad((persona as any).fec_nacimiento) ?? 'N/E')}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium w-20">Dirección:</span>
                  <span className="truncate">{persona.direccion || 'No especificada'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium w-20">Ubicación:</span>
                  <span className="truncate">{getUbicacion(persona)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de visualización */}
      {viewingPersona && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[800px] max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-[#01257D] dark:text-cyan-400">Detalles de Persona</h3>
                <button
                  onClick={() => setViewingPersona(null)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  {brokenImages[viewingPersona.id] ? (
                    <div className="w-40 h-40 bg-[#01257D] dark:bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-3xl mr-4">
                      {viewingPersona.nombre_completo.charAt(0).toUpperCase()}
                    </div>
                  ) : viewingPersona.foto_path ? (
                    <div className="mr-4">
                      <img
                        src={viewingPersona.foto_public_url ?? supabase.storage.from('personas-photos').getPublicUrl(viewingPersona.foto_path).data.publicUrl}
                        alt={viewingPersona.nombre_completo}
                        className="w-40 h-40 rounded-md object-cover block"
                        onError={() => handleImageError(viewingPersona.id, viewingPersona.foto_path)}
                        onLoad={() => clearImageError(viewingPersona.id)}
                      />
                      <div className="mt-2 text-sm">
                        <a href={viewingPersona.foto_public_url ?? supabase.storage.from('personas-photos').getPublicUrl(viewingPersona.foto_path).data.publicUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Abrir imagen</a>
                      </div>
                    </div>
                  ) : (
                    <div className="w-40 h-40 bg-[#01257D] dark:bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-3xl mr-4">
                      {viewingPersona.nombre_completo.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{viewingPersona.nombre_completo}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      viewingPersona.activo ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {viewingPersona.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Identificación</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      {viewingPersona.tipo_identificacion}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Identificación</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      {viewingPersona.identificacion}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      {viewingPersona.email || 'No especificado'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      {viewingPersona.telefono || 'No especificado'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Nacimiento</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">{(viewingPersona as any).fec_nacimiento || 'No especificado'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sexo</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">{(viewingPersona as any).sexo || 'No especificado'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nacionalidad (ID)</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">{(viewingPersona as any).nacionalidad_id || (viewingPersona.paises?.nombre) || 'No especificado'}</p>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Foto (path)</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md break-all">{viewingPersona.foto_path || 'No especificado'}</p>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md min-h-[60px]">
                      {viewingPersona.direccion || 'No especificada'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">País</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      {viewingPersona.paises?.nombre || 'No especificado'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Departamento</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      {viewingPersona.departamentos?.nombre || 'No especificado'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ciudad</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      {viewingPersona.ciudades?.nombre || 'No especificado'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Barrio</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      {viewingPersona.barrios?.nombre || 'No especificado'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => setViewingPersona(null)}
                    className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => {
                      setViewingPersona(null)
                      setEditingPersona(viewingPersona)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Editar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de edición */}
      {editingPersona && (
        <div>
          <PersonaForm
            persona={editingPersona}
            onSuccess={() => {
              console.log('onSuccess llamado, reseteando editingPersona')
              setEditingPersona(null)
              fetchPersonas()
            }}
          />
        </div>
      )}

      {/* Formulario de creación */}
      {showCreateForm && (
        <PersonaForm
          showButton={false}
          initialOpen={true}
          onSuccess={() => {
            setShowCreateForm(false)
            // recargar primera página para ver el nuevo registro
            setPage(0)
            setHasMore(true)
            fetchPersonas(0)
          }}
        />
      )}
      {/* Sentinel para carga incremental (IntersectionObserver) */}
      <div ref={sentinelRef as any} />

      <div className="flex justify-center items-center space-x-4 py-4">
        {loadingMore && <div className="text-sm text-gray-500">Cargando más...</div>}
        {!loadingMore && hasMore && (
          <button onClick={loadMore} className="px-4 py-2 bg-blue-600 text-white rounded-md">Cargar más</button>
        )}
        {!hasMore && <div className="text-sm text-gray-500">No hay más resultados</div>}
      </div>

      {/* Debug panel visible en desarrollo para mostrar último estado de fetch */}
      {lastDebug && (
        <div className="fixed bottom-4 left-4 z-50 bg-black bg-opacity-70 text-white text-xs p-2 rounded-md max-w-sm">
          <div className="font-semibold">DEBUG</div>
          <div className="truncate">{lastDebug}</div>
        </div>
      )}
    </div>
  )
}