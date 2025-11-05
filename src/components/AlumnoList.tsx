"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AlumnoForm } from './AlumnoForm'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Alumno {
  id: string
  id_turno?: number | null
  activo?: boolean
  fecha_inscripcion?: string
  RUE?: string
  motivo_rue?: string
  beca_id?: string
}

export function AlumnoList() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [personasMap, setPersonasMap] = useState<Record<string, any>>({})
  const [becasMap, setBecasMap] = useState<Record<string, any>>({})
  const [turnosMap, setTurnosMap] = useState<Record<any, any>>({})
  const [loading, setLoading] = useState(true)
  const [editingAlumno, setEditingAlumno] = useState<Alumno | null>(null)
  const [viewingAlumno, setViewingAlumno] = useState<Alumno | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const fetchAlumnos = async () => {
    try {
      const { data, error } = await supabase.from('alumnos').select('*').order('fecha_inscripcion', { ascending: false })
      if (error) {
        console.error('Error fetching alumnos:', error)
        setAlumnos([])
        setLoading(false)
        return
      }

      const rows = data || []
      setAlumnos(rows)

      // collect related ids
      const personaIds = Array.from(new Set(rows.map((r: any) => r.id).filter(Boolean)))
      const becaIds = Array.from(new Set(rows.map((r: any) => r.beca_id).filter(Boolean)))
      const turnoIds = Array.from(new Set(rows.map((r: any) => r.id_turno).filter(Boolean)))

      const [personasRes, becasRes, turnosRes] = await Promise.all([
        personaIds.length ? supabase.from('personas').select('id,nombre_completo,identificacion,email,telefono,direccion,fec_nacimiento,sexo,nacionalidad_id,foto_path,pais_id,departamento_id,ciudad_id,barrio_id').in('id', personaIds) : Promise.resolve({ data: [] }),
        becaIds.length ? supabase.from('becas').select('id,nombre,porcentaje_descuento').in('id', becaIds) : Promise.resolve({ data: [] }),
        turnoIds.length ? supabase.from('turnos').select('id,nombre').in('id', turnoIds) : Promise.resolve({ data: [] }),
      ])

      const pMap: Record<string, any> = {}
      ;(personasRes.data || []).forEach((p: any) => pMap[p.id] = p)

      // Try to attach a usable public URL for persona photos (best-effort).
      // Validate public url with a lightweight GET range; if it fails (private bucket or CORS),
      // attempt to create a signed URL and use it instead.
      for (const pid of Object.keys(pMap)) {
        const p = pMap[pid]
        if (!p || !p.foto_path) continue
        try {
          const publicUrl = supabase.storage.from('personas-photos').getPublicUrl(p.foto_path).data.publicUrl
          let chosen: string | null = null
          try {
            const res = await fetch(publicUrl, { method: 'GET', headers: { Range: 'bytes=0-0' } })
            const ct = res.headers.get('content-type') || ''
            if (res.ok && ct.startsWith('image')) chosen = publicUrl
          } catch (err) {
            // GET may fail due to CORS or private bucket; we'll try signed url below
          }

          if (!chosen) {
            try {
              const { data: signedData, error: signedErr } = await supabase.storage.from('personas-photos').createSignedUrl(p.foto_path, 3600) // Aumentamos el tiempo a 1 hora
              if (!signedErr && (signedData as any)?.signedUrl) {
                chosen = (signedData as any).signedUrl
              } else if (signedErr) {
                console.warn('Error getting signed URL:', signedErr)
              }
            } catch (e) {
              console.warn('Exception getting signed URL:', e)
            }
          }

          p.foto_public_url = chosen || null // Si no hay URL válida, no mostramos imagen
        } catch (e) {
          console.warn('AlumnoList: error computing foto_public_url for', pid, e)
        }
      }
      const bMap: Record<string, any> = {}
      ;(becasRes.data || []).forEach((b: any) => bMap[b.id] = b)
      const tMap: Record<number, any> = {}
      ;(turnosRes.data || []).forEach((t: any) => tMap[t.id] = t)

      setPersonasMap(pMap)
      setBecasMap(bMap)
      setTurnosMap(tMap)

    } catch (err) {
      console.error('Exception fetching alumnos:', err)
      setAlumnos([])
    }
    setLoading(false)
  }

  useEffect(() => { fetchAlumnos() }, [])

  const activoBool = (val: any) => val === true || val === 'true' || val === 't' || val === 1 || val === '1'

  const filtered = alumnos.filter(a => {
    const persona = personasMap[a.id]
    const name = persona?.nombre_completo || ''
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || (a.RUE || '').toLowerCase().includes(searchTerm.toLowerCase())
  })

  const exportToExcel = () => {
    const dataToExport = filtered.map(a => ({
      'Nombre': personasMap[a.id]?.nombre_completo || 'Sin persona',
      'Identificación': personasMap[a.id]?.identificacion || '',
      'Email': personasMap[a.id]?.email || '',
      'Teléfono': personasMap[a.id]?.telefono || '',
      'Dirección': personasMap[a.id]?.direccion || '',
      'Fecha Nac.': personasMap[a.id]?.fec_nacimiento || '',
      'Sexo': personasMap[a.id]?.sexo || '',
      'Turno': (turnosMap[a.id_turno as any]?.nombre) || '—',
      'Fecha Inscripción': a.fecha_inscripcion || '',
      'RUE': String(a.RUE ?? ''),
      'Beca': (becasMap[a.beca_id as any]?.nombre) || '—',
      'Descuento': (becasMap[a.beca_id as any]?.porcentaje_descuento) ? `${becasMap[a.beca_id as any].porcentaje_descuento}%` : '—',
      'Estado': activoBool(a.activo) ? 'Activo' : 'Inactivo'
    }))
    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Alumnos')
    XLSX.writeFile(wb, `alumnos_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Listado de Alumnos', 14, 22)
    doc.setFontSize(11)
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 32)
    autoTable(doc, {
      head: [[
        'Nombre','Identificación','Email','Teléfono','Dirección','Fecha Nac.','Sexo','Turno','Fecha Inscripción','RUE','Beca','Descuento','Estado'
      ]],
      body: filtered.map(a => [
        personasMap[a.id]?.nombre_completo || 'Sin persona',
        personasMap[a.id]?.identificacion || '',
        personasMap[a.id]?.email || '',
        personasMap[a.id]?.telefono || '',
        personasMap[a.id]?.direccion || '',
        personasMap[a.id]?.fec_nacimiento || '',
        personasMap[a.id]?.sexo || '',
        (turnosMap[a.id_turno as any]?.nombre) || '—',
        a.fecha_inscripcion || '',
        String(a.RUE ?? ''),
        (becasMap[a.beca_id as any]?.nombre) || '—',
        (becasMap[a.beca_id as any]?.porcentaje_descuento) ? `${becasMap[a.beca_id as any].porcentaje_descuento}%` : '—',
        activoBool(a.activo) ? 'Activo' : 'Inactivo'
      ]),
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [1,39,125], textColor: 255 }
    })
    doc.save(`alumnos_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const printList = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const htmlContent = `
      <html>
        <head>
          <title>Listado de Alumnos</title>
          <style> body { font-family: Arial, sans-serif; margin: 20px; } th { background-color: #01257D; color: white; } table { width:100%; border-collapse: collapse; } th, td { border:1px solid #ddd; padding:8px; } </style>
        </head>
        <body>
          <h1>Listado de Alumnos</h1>
          <div>Fecha: ${new Date().toLocaleDateString()}</div>
          <table>
            <thead><tr><th>Nombre</th><th>Turno</th><th>Fecha</th><th>RUE</th><th>Beca</th><th>Descuento</th><th>Estado</th></tr></thead>
            <tbody>
              ${filtered.map(a => `
                  <tr>
                    <td>${personasMap[a.id]?.nombre_completo || 'Sin persona'}</td>
                    <td>${personasMap[a.id]?.identificacion || ''}</td>
                    <td>${personasMap[a.id]?.email || ''}</td>
                    <td>${personasMap[a.id]?.telefono || ''}</td>
                    <td>${(turnosMap[a.id_turno as any]?.nombre) || '—'}</td>
                    <td>${a.fecha_inscripcion || ''}</td>
                    <td>${a.RUE || ''}</td>
                    <td>${(becasMap[a.beca_id as any]?.nombre) || '—'}</td>
                    <td>${(becasMap[a.beca_id as any]?.porcentaje_descuento) ? becasMap[a.beca_id as any].porcentaje_descuento + '%' : '—'}</td>
                    <td>${activoBool(a.activo) ? 'Activo' : 'Inactivo'}</td>
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

  if (loading) return <div>Cargando...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#01257D] dark:text-cyan-400">Alumnos</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input type="text" placeholder="Buscar alumnos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="block w-64 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500" />
          </div>

          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 text-[#01257D]' : 'text-gray-600'}`} title="Vista de lista">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            </button>
            <button onClick={() => setViewMode('cards')} className={`p-2 rounded-md ${viewMode === 'cards' ? 'bg-white dark:bg-gray-600 text-[#01257D]' : 'text-gray-600'}`} title="Vista de tarjetas">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </button>
          </div>

          <div className="flex space-x-2">
            <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium">Excel</button>
            <button onClick={exportToPDF} className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium">PDF</button>
            <button onClick={printList} className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium">Imprimir</button>
            <AlumnoForm onSuccess={fetchAlumnos} />
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            <li className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500">
              <button onClick={() => setShowCreateForm(true)} className="w-full flex items-center justify-center py-8 text-blue-600" title="Agregar nuevo alumno">
                <svg className="w-12 h-12 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                <span className="text-xl font-semibold">Agregar Nuevo Alumno</span>
              </button>
            </li>
            {filtered.map(a => (
              <li key={a.id} className="relative px-6 py-4">
                <div className="absolute top-2 right-2 flex space-x-2 z-10">
                  <button onClick={() => setViewingAlumno(a)} className="p-2 text-green-600">Ver</button>
                  <button onClick={() => setEditingAlumno(a)} className="p-2 text-blue-600">Editar</button>
                </div>
                <div className="pr-20 flex items-center">
                  {/* avatar */}
                  {personasMap[a.id]?.foto_public_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={personasMap[a.id].foto_public_url} alt="foto" className="w-10 h-10 object-cover rounded-full mr-3" />
                  ) : (
                    <div className="w-10 h-10 bg-[#01257D] rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">{(personasMap[a.id]?.nombre_completo || 'S').charAt(0).toUpperCase()}</div>
                  )}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{personasMap[a.id]?.nombre_completo || 'Sin persona'}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-300">Turno: {(turnosMap[a.id_turno as any]?.nombre) || '—'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-300">Inscripción: {a.fecha_inscripcion || ''}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div role="button" tabIndex={0} onClick={() => setShowCreateForm(true)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowCreateForm(true) } }} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border-2 border-dashed border-blue-300 flex items-center justify-center cursor-pointer">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              <span className="text-lg font-semibold text-blue-600">Agregar Nuevo Alumno</span>
            </div>
          </div>

          {filtered.map(a => (
            <div key={a.id} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200">
              <div className="absolute bottom-3 right-3 flex space-x-2 z-10">
                <button 
                  onClick={() => setViewingAlumno(a)} 
                  className="p-2 text-green-600 hover:bg-green-100 rounded-full"
                  title="Ver detalles"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button 
                  onClick={() => setEditingAlumno(a)} 
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                  title="Editar alumno"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button 
                  onClick={async () => {
                    const newStatus = !activoBool(a.activo);
                    const message = newStatus ? '¿Estás seguro de que deseas activar este alumno?' : '¿Estás seguro de que deseas inactivar este alumno?';
                    if (window.confirm(message)) {
                      await supabase.from('alumnos').update({ activo: newStatus }).eq('id', a.id)
                      fetchAlumnos()
                    }
                  }} 
                  className={`p-2 ${activoBool(a.activo) ? 'text-green-600 hover:bg-green-100' : 'text-red-600 hover:bg-red-100'} rounded-full`}
                  title={activoBool(a.activo) ? 'Alumno Activo - Click para Inactivar' : 'Alumno Inactivo - Click para Activar'}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {activoBool(a.activo) ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                  </svg>
                </button>
              </div>
              <div className="flex items-start">
                {personasMap[a.id]?.foto_public_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={personasMap[a.id].foto_public_url} alt="foto" className="w-12 h-12 object-cover rounded-full" />
                ) : (
                  <div className="w-12 h-12 bg-[#01257D] rounded-full flex items-center justify-center text-white font-bold text-lg">{(personasMap[a.id]?.nombre_completo || 'S').charAt(0).toUpperCase()}</div>
                )}
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{personasMap[a.id]?.nombre_completo || 'Sin persona'}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-300">{(turnosMap[a.id_turno as any]?.nombre) || '—'}</p>
                  <p className="text-sm text-green-600">{(becasMap[a.beca_id as any]?.porcentaje_descuento) ? `Descuento: ${becasMap[a.beca_id as any].porcentaje_descuento}%` : ''}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingAlumno && (
        <div className="fixed inset-0 bg-black bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[800px] max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-[#01257D] dark:text-cyan-400">Detalles Alumno</h3>
                <button onClick={() => setViewingAlumno(null)} className="text-gray-400 hover:text-gray-600 dark:text-gray-300">Cerrar</button>
              </div>
              <div className="space-y-4">
                {/* Persona resumen: foto + nombre */}
                <div className="flex items-center mb-4">
                  {personasMap[viewingAlumno.id]?.foto_public_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={personasMap[viewingAlumno.id].foto_public_url} alt="foto" className="w-16 h-16 object-cover rounded-md mr-4" />
                  ) : (
                    <div className="w-16 h-16 bg-[#01257D] rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">{(personasMap[viewingAlumno.id]?.nombre_completo || 'S').charAt(0).toUpperCase()}</div>
                  )}
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{personasMap[viewingAlumno.id]?.nombre_completo || 'Sin persona'}</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{personasMap[viewingAlumno.id]?.identificacion || ''}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Inscripción</label>
                    <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md">{viewingAlumno.fecha_inscripcion}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Turno</label>
                    <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md">{(turnosMap[viewingAlumno.id_turno as any]?.nombre) || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">RUE</label>
                    <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md">{String(viewingAlumno.RUE) || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Beca</label>
                    <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md">{(becasMap[viewingAlumno.beca_id as any]?.nombre) || '—'}</p>
                  </div>
                  {/* Persona detalles adicionales */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md">{personasMap[viewingAlumno.id]?.email || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                    <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md">{personasMap[viewingAlumno.id]?.telefono || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Nac.</label>
                    <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md">{personasMap[viewingAlumno.id]?.fec_nacimiento || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sexo</label>
                    <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md">{personasMap[viewingAlumno.id]?.sexo || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</label>
                    <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md">{personasMap[viewingAlumno.id]?.direccion || '—'}</p>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button onClick={() => setViewingAlumno(null)} className="bg-gray-300 px-4 py-2 rounded-md">Cerrar</button>
                  <button onClick={() => { setViewingAlumno(null); setEditingAlumno(viewingAlumno) }} className="bg-blue-600 text-white px-4 py-2 rounded-md">Editar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingAlumno && (
        <div>
          <AlumnoForm alumno={editingAlumno} onSuccess={() => { setEditingAlumno(null); fetchAlumnos() }} onClose={() => setEditingAlumno(null)} />
        </div>
      )}

      {showCreateForm && (
        <AlumnoForm showButton={false} initialOpen={true} onSuccess={() => { setShowCreateForm(false); fetchAlumnos() }} onClose={() => setShowCreateForm(false)} />
      )}
    </div>
  )
}
