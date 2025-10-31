"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TurnoForm } from './TurnoForm'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Turno {
  id: string
  codigo?: string
  nombre: string
  hora_inicio?: string
  hora_fin?: string
  activo?: boolean
  tipo?: string
  lunes?: boolean
  martes?: boolean
  miercoles?: boolean
  jueves?: boolean
  viernes?: boolean
  sabado?: boolean
  domingo?: boolean
}

export function TurnoList() {
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTurno, setEditingTurno] = useState<Turno | null>(null)
  const [viewingTurno, setViewingTurno] = useState<Turno | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const fetchTurnos = async () => {
    try {
      const { data, error } = await supabase
        .from('turnos')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) {
        console.error('Error fetching turnos:', error)
        setTurnos([])
      } else {
        setTurnos(data || [])
      }
    } catch (err) {
      console.error('Exception fetching turnos:', err)
      setTurnos([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchTurnos()
  }, [])

  // Normaliza distintos tipos que pueda devolver la base (boolean true/false o strings 'true'/'false')
  const activoBool = (val: any) => {
    return val === true || val === 'true' || val === 't' || val === 1 || val === '1'
  }

  const daysStr = (t: any) => {
    const map = [
      ['lunes', 'Lun'],
      ['martes', 'Mar'],
      ['miercoles', 'Mié'],
      ['jueves', 'Jue'],
      ['viernes', 'Vie'],
      ['sabado', 'Sáb'],
      ['domingo', 'Dom'],
    ]
    return map.filter(([key]) => !!t[key]).map(([, label]) => label).join(' ')
  }

  const handleToggleActive = async (turno: Turno) => {
    try {
      const newActiveStatus = !activoBool(turno.activo)
      const { error } = await supabase
        .from('turnos')
        .update({ activo: newActiveStatus })
        .eq('id', turno.id)

      if (error) {
        console.error('Error toggling active status:', error)
        return
      }

      setTurnos(prev => prev.map(t => t.id === turno.id ? { ...t, activo: newActiveStatus } : t))
    } catch (err) {
      console.error('Exception toggling active status:', err)
    }
  }

  const filtered = turnos.filter(t =>
    (t.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.codigo || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const exportToExcel = () => {
    const dataToExport = filtered.map(t => ({
      'Código': t.codigo || '',
      'Nombre': t.nombre,
      'Tipo': t.tipo || '',
      'Hora Inicio': t.hora_inicio || '',
      'Hora Fin': t.hora_fin || '',
      'Días': daysStr(t),
      'Estado': activoBool(t.activo) ? 'Activo' : 'Inactivo'
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Turnos')
    XLSX.writeFile(wb, `turnos_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('Listado de Turnos', 14, 22)
    doc.setFontSize(11)
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 32)

  const tableData = filtered.map(t => [t.codigo || '', t.nombre, t.hora_inicio || '', t.hora_fin || '', daysStr(t), activoBool(t.activo) ? 'Activo' : 'Inactivo'])

    autoTable(doc, {
      head: [['Código', 'Nombre', 'Tipo', 'Hora Inicio', 'Hora Fin', 'Días', 'Estado']],
      body: filtered.map(t => [t.codigo || '', t.nombre, t.tipo || '', t.hora_inicio || '', t.hora_fin || '', daysStr(t), activoBool(t.activo) ? 'Activo' : 'Inactivo']),
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [1, 39, 125], textColor: 255, fontSize: 9, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    })

    doc.save(`turnos_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const printList = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const htmlContent = `
      <html>
        <head>
          <title>Listado de Turnos</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #01257D; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #01257D; color: white; }
            tr:nth-child(even) { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Listado de Turnos</h1>
          <div>Fecha: ${new Date().toLocaleDateString()}</div>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Hora Inicio</th>
                <th>Hora Fin</th>
                <th>Días</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(t => `
                <tr>
                  <td>${t.codigo || ''}</td>
                  <td>${t.nombre}</td>
                  <td>${t.tipo || ''}</td>
                  <td>${t.hora_inicio || ''}</td>
                  <td>${t.hora_fin || ''}</td>
                  <td>${daysStr(t)}</td>
                  <td>${activoBool(t.activo) ? 'Activo' : 'Inactivo'}</td>
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
        <h2 className="text-2xl font-bold text-[#01257D] dark:text-cyan-400">Turnos</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar turnos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-64 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

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

          <div className="flex space-x-2">
            <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span>Excel</span>
            </button>
            <button onClick={exportToPDF} className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              <span>PDF</span>
            </button>
            <button onClick={printList} className="bg-gray-600 hover:bg-gray-700 dark:bg-gray-500 dark:hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            </button>

            <TurnoForm onSuccess={fetchTurnos} />
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            <li className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500">
              <button onClick={() => setShowCreateForm(true)} className="w-full flex items-center justify-center py-8 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                <svg className="w-12 h-12 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                <span className="text-xl font-semibold">Agregar Nuevo Turno</span>
              </button>
            </li>
            {filtered.map(t => (
              <li key={t.id} className="relative px-6 py-4">
                <div className="absolute top-2 right-2 flex space-x-2 z-10">
                  <button onClick={() => setViewingTurno(t)} className="p-2 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors" title="Ver detalles">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </button>
                  <button onClick={() => setEditingTurno(t)} className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors" title="Editar turno">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => handleToggleActive(t)} className={`p-2 rounded-md transition-colors ${activoBool(t.activo) ? 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'}`} title={activoBool(t.activo) ? 'Desactivar turno' : 'Activar turno'}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                </div>
                <div className="pr-20">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t.nombre}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.codigo || ''}</p>
                  {t.tipo && <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">{t.tipo}</span>}
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.hora_inicio || ''} - {t.hora_fin || ''}</p>
                  <div className="mt-2">
                    <span className="text-xs text-gray-600 dark:text-gray-300">{daysStr(t) || '—'}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setShowCreateForm(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowCreateForm(true) } }}
            title="Agregar nuevo turno"
            className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-md p-6 border-2 border-dashed border-blue-300 dark:border-blue-600 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
          >
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">Agregar Nuevo Turno</span>
            </div>
          </div>

          {filtered.map(t => (
            <div key={t.id} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="absolute bottom-3 right-3 flex space-x-2 z-10">
                <button onClick={() => setViewingTurno(t)} className="p-2 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors" title="Ver detalles"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                <button onClick={() => setEditingTurno(t)} className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors" title="Editar turno"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                <button onClick={() => handleToggleActive(t)} className={`p-2 rounded-md transition-colors ${activoBool(t.activo) ? 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'}`} title={activoBool(t.activo) ? 'Desactivar turno' : 'Activar turno'}><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
              </div>

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-[#01257D] dark:bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">{t.nombre.charAt(0).toUpperCase()}</div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.nombre}</h3>
                    <div className="flex items-center space-x-2">
                      {t.tipo && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300">{t.tipo}</span>}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${activoBool(t.activo) ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>{activoBool(t.activo) ? 'Activo' : 'Inactivo'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium w-24">Código:</span>
                  <span className="truncate">{t.codigo || ''}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium w-24">Horario:</span>
                  <span className="text-gray-700 dark:text-gray-200">{t.hora_inicio || ''} - {t.hora_fin || ''}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{daysStr(t) || '—'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewingTurno && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[800px] max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-[#01257D] dark:text-cyan-400">Detalles de Turno</h3>
                <button onClick={() => setViewingTurno(null)} className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-[#01257D] dark:bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">{viewingTurno.nombre.charAt(0).toUpperCase()}</div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{viewingTurno.nombre}</h4>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">{viewingTurno.nombre}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Código</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">{viewingTurno.codigo || ''}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">{viewingTurno.tipo || '—'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Horario</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">{viewingTurno.hora_inicio || ''} - {viewingTurno.hora_fin || ''}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                    <p className={`mt-1 text-sm bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md font-semibold ${activoBool(viewingTurno.activo) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{activoBool(viewingTurno.activo) ? 'Activo' : 'Inactivo'}</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button onClick={() => setViewingTurno(null)} className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium">Cerrar</button>
                  <button onClick={() => { setViewingTurno(null); setEditingTurno(viewingTurno) }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">Editar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingTurno && (
        <div>
          <TurnoForm turno={editingTurno} onSuccess={() => { setEditingTurno(null); fetchTurnos() }} onClose={() => setEditingTurno(null)} />
        </div>
      )}

      {showCreateForm && (
        <TurnoForm showButton={false} initialOpen={true} onSuccess={() => { setShowCreateForm(false); fetchTurnos() }} onClose={() => setShowCreateForm(false)} />
      )}
    </div>
  )
}
