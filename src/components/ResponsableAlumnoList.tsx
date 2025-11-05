"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ResponsableAlumnoForm } from './ResponsableAlumnoForm'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
  const [viewingResponsable, setViewingResponsable] = useState<ResponsableAlumno | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards')
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

  const exportToExcel = () => {
    const dataToExport = filteredResponsables.map(r => ({
      'Responsable': r.responsable?.nombre_completo || 'Sin responsable',
      'Identificación Responsable': r.responsable?.identificacion || '',
      'Email Responsable': r.responsable?.email || '',
      'Teléfono Responsable': r.responsable?.telefono || '',
      'Alumno': r.alumno?.nombre_completo || 'Sin alumno',
      'Identificación Alumno': r.alumno?.identificacion || '',
      'Tipo de Relación': r.tipo_relacion?.descripcion || 'Sin tipo',
      'Contacto Principal': r.ind_contacto_principal ? 'Sí' : 'No',
      'Autorizado para Retiro': r.ind_autorizado_retiro ? 'Sí' : 'No',
      'Fecha Creación': r.created_at ? new Date(r.created_at).toLocaleDateString() : ''
    }))
    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Responsables_Alumnos')
    XLSX.writeFile(wb, `responsables_alumnos_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Listado de Responsables de Alumnos', 14, 22)
    doc.setFontSize(11)
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 32)
    autoTable(doc, {
      head: [[
        'Responsable','Identificación','Email','Teléfono','Alumno','Tipo Relación','Principal','Autorizado','Fecha'
      ]],
      body: filteredResponsables.map(r => [
        r.responsable?.nombre_completo || 'Sin responsable',
        r.responsable?.identificacion || '',
        r.responsable?.email || '',
        r.responsable?.telefono || '',
        r.alumno?.nombre_completo || 'Sin alumno',
        r.tipo_relacion?.descripcion || 'Sin tipo',
        r.ind_contacto_principal ? 'Sí' : 'No',
        r.ind_autorizado_retiro ? 'Sí' : 'No',
        r.created_at ? new Date(r.created_at).toLocaleDateString() : ''
      ]),
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [1,39,125], textColor: 255 }
    })
    doc.save(`responsables_alumnos_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const printList = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    const htmlContent = `
      <html>
        <head>
          <title>Listado de Responsables de Alumnos</title>
          <style> body { font-family: Arial, sans-serif; margin: 20px; } th { background-color: #01257D; color: white; } table { width:100%; border-collapse: collapse; } th, td { border:1px solid #ddd; padding:8px; } </style>
        </head>
        <body>
          <h1>Listado de Responsables de Alumnos</h1>
          <div>Fecha: ${new Date().toLocaleDateString()}</div>
          <table>
            <thead><tr><th>Responsable</th><th>Alumno</th><th>Tipo Relación</th><th>Principal</th><th>Autorizado</th><th>Fecha</th></tr></thead>
            <tbody>
              ${filteredResponsables.map(r => `
                  <tr>
                    <td>${r.responsable?.nombre_completo || 'Sin responsable'}</td>
                    <td>${r.alumno?.nombre_completo || 'Sin alumno'}</td>
                    <td>${r.tipo_relacion?.descripcion || 'Sin tipo'}</td>
                    <td>${r.ind_contacto_principal ? 'Sí' : 'No'}</td>
                    <td>${r.ind_autorizado_retiro ? 'Sí' : 'No'}</td>
                    <td>${r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</td>
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
            <ResponsableAlumnoForm onSuccess={fetchResponsables} />
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            <li className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500">
              <button onClick={() => setShowCreateForm(true)} className="w-full flex items-center justify-center py-8 text-blue-600" title="Agregar nueva asociación">
                <svg className="w-12 h-12 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                <span className="text-xl font-semibold">Agregar Nueva Asociación</span>
              </button>
            </li>
            {filteredResponsables.length === 0 ? (
              <li className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                No hay asociaciones de responsables registradas
              </li>
            ) : (
              filteredResponsables.map(r => (
                <li key={r.id_responsable_alumno} className="relative px-6 py-4">
                  <div className="absolute top-2 right-2 flex space-x-2 z-10">
                    <button onClick={() => setViewingResponsable(r)} className="p-2 text-green-600 hover:bg-green-100 rounded-full" title="Ver detalles">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
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
                  <div className="pr-20 flex items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {r.responsable?.nombre_completo || 'Responsable desconocido'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        Alumno: {r.alumno?.nombre_completo || 'Alumno desconocido'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-300">
                        Relación: {r.tipo_relacion?.descripcion || 'Tipo desconocido'}
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
                </li>
              ))
            )}
          </ul>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div role="button" tabIndex={0} onClick={() => setShowCreateForm(true)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowCreateForm(true) } }} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border-2 border-dashed border-blue-300 flex items-center justify-center cursor-pointer">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              <span className="text-lg font-semibold text-blue-600">Agregar Nueva Asociación</span>
            </div>
          </div>

          {filteredResponsables.map(r => (
            <div key={r.id_responsable_alumno} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200">
              <div className="absolute bottom-3 right-3 flex space-x-2 z-10">
                <button
                  onClick={() => setViewingResponsable(r)}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-full"
                  title="Ver detalles"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => setEditingResponsable(r)}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                  title="Editar asociación"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(r.id_responsable_alumno)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                  title="Eliminar asociación"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div className="flex items-start">
                <div className="w-12 h-12 bg-[#01257D] rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {(r.responsable?.nombre_completo || 'R').charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {r.responsable?.nombre_completo || 'Responsable desconocido'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    Alumno: {r.alumno?.nombre_completo || 'Alumno desconocido'}
                  </p>
                  <p className="text-sm text-blue-600">
                    {r.tipo_relacion?.descripcion || 'Tipo desconocido'}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
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
          ))}
        </div>
      )}

      {viewingResponsable && (
        <div className="fixed inset-0 bg-black bg-opacity-70 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[800px] max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-[#01257D] dark:text-cyan-400">Detalles de Asociación</h3>
                <button onClick={() => setViewingResponsable(null)} className="text-gray-400 hover:text-gray-600 dark:text-gray-300">Cerrar</button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Responsable</label>
                    <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md">
                      {viewingResponsable.responsable?.nombre_completo || 'Sin responsable'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Identificación Responsable</label>
                    <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md">
                      {viewingResponsable.responsable?.identificacion || '—'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Responsable</label>
                    <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md">
                      {viewingResponsable.responsable?.email || '—'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono Responsable</label>
                    <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md">
                      {viewingResponsable.responsable?.telefono || '—'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alumno</label>
                    <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md">
                      {viewingResponsable.alumno?.nombre_completo || 'Sin alumno'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Identificación Alumno</label>
                    <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md">
                      {viewingResponsable.alumno?.identificacion || '—'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Relación</label>
                    <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md">
                      {viewingResponsable.tipo_relacion?.descripcion || 'Sin tipo'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Creación</label>
                    <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md">
                      {viewingResponsable.created_at ? new Date(viewingResponsable.created_at).toLocaleDateString() : '—'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contacto Principal</label>
                    <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md">
                      {viewingResponsable.ind_contacto_principal ? 'Sí' : 'No'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Autorizado para Retiro</label>
                    <p className="mt-1 text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2 rounded-md">
                      {viewingResponsable.ind_autorizado_retiro ? 'Sí' : 'No'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button onClick={() => setViewingResponsable(null)} className="bg-gray-300 px-4 py-2 rounded-md">Cerrar</button>
                  <button onClick={() => { setViewingResponsable(null); setEditingResponsable(viewingResponsable) }} className="bg-blue-600 text-white px-4 py-2 rounded-md">Editar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingResponsable && (
        <ResponsableAlumnoForm
          responsable={editingResponsable}
          onSuccess={() => { setEditingResponsable(null); fetchResponsables() }}
          onClose={() => setEditingResponsable(null)}
        />
      )}

      {showCreateForm && (
        <ResponsableAlumnoForm showButton={false} initialOpen={true} onSuccess={() => { setShowCreateForm(false); fetchResponsables() }} onClose={() => setShowCreateForm(false)} />
      )}
    </div>
  )
}