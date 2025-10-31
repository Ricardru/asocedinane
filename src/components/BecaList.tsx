'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BecaForm } from './BecaForm'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Beca {
  id: string
  nombre: string
  descripcion?: string
  porcentaje_descuento: number
  activo?: string
}

export function BecaList() {
  const [becas, setBecas] = useState<Beca[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBeca, setEditingBeca] = useState<Beca | null>(null)
  const [viewingBeca, setViewingBeca] = useState<Beca | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  const fetchBecas = async () => {
    try {
      const { data, error } = await supabase
        .from('becas')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) {
        console.error('Error fetching becas:', error)
        setBecas([])
      } else {
        setBecas(data || [])
      }
    } catch (err) {
      console.error('Exception fetching becas:', err)
      setBecas([])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBecas()
  }, [])

  const handleToggleActive = async (beca: Beca) => {
    try {
      const newActiveStatus = beca.activo === 'true' ? 'false' : 'true'
      const { error } = await supabase
        .from('becas')
        .update({ activo: newActiveStatus })
        .eq('id', beca.id)

      if (error) {
        console.error('Error toggling active status:', error)
        return
      }

      // Actualizar el estado local
      setBecas(prevBecas =>
        prevBecas.map(b =>
          b.id === beca.id ? { ...b, activo: newActiveStatus } : b
        )
      )
    } catch (err) {
      console.error('Exception toggling active status:', err)
    }
  }

  const filteredBecas = becas.filter(beca =>
    beca.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    beca.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    beca.porcentaje_descuento.toString().includes(searchTerm)
  )

  // Función para exportar a Excel
  const exportToExcel = () => {
    const dataToExport = filteredBecas.map(beca => ({
      'Nombre': beca.nombre,
      'Descripción': beca.descripcion || 'Sin descripción',
      'Porcentaje de Descuento': `${beca.porcentaje_descuento}%`,
      'Estado': beca.activo === 'true' ? 'Activa' : 'Inactiva'
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Becas')
    XLSX.writeFile(wb, `becas_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Función para exportar a PDF
  const exportToPDF = () => {
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text('Listado de Becas', 14, 22)

    // Fecha
    doc.setFontSize(11)
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 32)

    // Datos de la tabla
    const tableData = filteredBecas.map(beca => [
      beca.nombre,
      beca.descripcion || 'Sin descripción',
      `${beca.porcentaje_descuento}%`,
      beca.activo === 'true' ? 'Activa' : 'Inactiva'
    ])

    autoTable(doc, {
      head: [['Nombre', 'Descripción', 'Porcentaje de Descuento', 'Estado']],
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

    doc.save(`becas_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  // Función para imprimir
  const printList = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const htmlContent = `
      <html>
        <head>
          <title>Listado de Becas</title>
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
            <h1>Listado de Becas</h1>
          </div>
          <div class="date">
            Fecha: ${new Date().toLocaleDateString()}
          </div>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Porcentaje de Descuento</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBecas.map(beca => `
                <tr>
                  <td>${beca.nombre}</td>
                  <td>${beca.descripcion || 'Sin descripción'}</td>
                  <td>${beca.porcentaje_descuento}%</td>
                  <td>${beca.activo === 'true' ? 'Activa' : 'Inactiva'}</td>
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
        <h2 className="text-2xl font-bold text-[#01257D] dark:text-cyan-400">Becas</h2>
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
              placeholder="Buscar becas..."
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

          <BecaForm onSuccess={fetchBecas} />
        </div>
      </div>

      {viewMode === 'list' ? (
        /* Vista de Lista */
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Tarjeta de agregar beca */}
            <li className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500">
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center py-8 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                title="Agregar nueva beca"
              >
                <svg className="w-12 h-12 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-xl font-semibold">Agregar Nueva Beca</span>
              </button>
            </li>
            {filteredBecas.map((beca) => (
              <li key={beca.id} className="relative px-6 py-4">
                <div className="absolute top-2 right-2 flex space-x-2 z-10">
                  <button
                    onClick={() => setViewingBeca(beca)}
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
                      console.log('Editando beca:', beca)
                      setEditingBeca(beca)
                    }}
                    className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                    title="Editar beca"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleToggleActive(beca)}
                    className={`p-2 rounded-md transition-colors ${
                      beca.activo === 'true'
                        ? 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                        : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                    }`}
                    title={beca.activo === 'true' ? 'Desactivar beca' : 'Activar beca'}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                <div className="pr-20">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">{beca.nombre}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {beca.descripcion || 'Sin descripción'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Descuento: {beca.porcentaje_descuento}%</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        /* Vista de Tarjetas */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tarjeta de agregar beca */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-md p-6 border-2 border-dashed border-blue-300 dark:border-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" onClick={() => setShowCreateForm(true)} title="Agregar nueva beca">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">Agregar Nueva Beca</span>
            </div>
          </div>
          {filteredBecas.map((beca) => (
            <div key={beca.id} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="absolute bottom-3 right-3 flex space-x-2 z-10">
                <button
                  onClick={() => setViewingBeca(beca)}
                  className="p-2 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                  title="Ver detalles"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => setEditingBeca(beca)}
                  className="p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  title="Editar beca"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleToggleActive(beca)}
                  className={`p-2 rounded-md transition-colors ${
                    beca.activo === 'true'
                      ? 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                      : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                  title={beca.activo === 'true' ? 'Desactivar beca' : 'Activar beca'}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-[#01257D] dark:bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {beca.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{beca.nombre}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      beca.activo === 'true'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {beca.activo === 'true' ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium w-24">Descripción:</span>
                  <span className="truncate">{beca.descripcion || 'Sin descripción'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium w-24">Descuento:</span>
                  <span className="text-green-600 dark:text-green-400 font-semibold">{beca.porcentaje_descuento}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de visualización */}
      {viewingBeca && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-[800px] max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-[#01257D] dark:text-cyan-400">Detalles de Beca</h3>
                <button
                  onClick={() => setViewingBeca(null)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-[#01257D] dark:bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">
                    {viewingBeca.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{viewingBeca.nombre}</h4>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      {viewingBeca.nombre}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md min-h-[60px]">
                      {viewingBeca.descripcion || 'Sin descripción'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Porcentaje de Descuento</label>
                    <p className="mt-1 text-sm text-green-600 dark:text-green-400 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md font-semibold">
                      {viewingBeca.porcentaje_descuento}%
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                    <p className={`mt-1 text-sm bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md font-semibold ${
                      viewingBeca.activo === 'true'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {viewingBeca.activo === 'true' ? 'Activa' : 'Inactiva'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => setViewingBeca(null)}
                    className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => {
                      setViewingBeca(null)
                      setEditingBeca(viewingBeca)
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
      {editingBeca && (
        <div>
          <BecaForm
            beca={editingBeca}
            onSuccess={() => {
              console.log('onSuccess llamado, reseteando editingBeca')
              setEditingBeca(null)
              fetchBecas()
            }}
          />
        </div>
      )}

      {/* Formulario de creación */}
      {showCreateForm && (
        <BecaForm
          showButton={false}
          initialOpen={true}
          onSuccess={() => {
            setShowCreateForm(false)
            fetchBecas()
          }}
        />
      )}
    </div>
  )
}