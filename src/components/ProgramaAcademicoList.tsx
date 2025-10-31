'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ProgramaAcademicoForm } from './ProgramaAcademicoForm'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ProgramaAcademico {
  id: number
  nombre: string
  descripcion: string | null
  duracion_anios: number | null
  titulo_otorgado: string | null
  modalidad: 'Presencial' | 'Online' | 'Híbrido' | null
  activo: boolean
  fecha_creacion: string
}

export function ProgramaAcademicoList() {
  const [programas, setProgramas] = useState<ProgramaAcademico[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPrograma, setEditingPrograma] = useState<ProgramaAcademico | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchProgramas()
  }, [])

  const fetchProgramas = async () => {
    const { data, error } = await supabase
      .from('programas_academicos')
      .select('*')
      .order('fecha_creacion', { ascending: false })

    if (error) {
      console.error('Error fetching programas:', error)
    } else {
      setProgramas(data || [])
    }
    setLoading(false)
  }

  // Filtrar programas basándose en el término de búsqueda
  const filteredProgramas = programas.filter(programa =>
    programa.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    programa.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    programa.titulo_otorgado?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    programa.modalidad?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Función para exportar a Excel
  const exportToExcel = () => {
    const dataToExport = filteredProgramas.map(programa => ({
      'Nombre': programa.nombre,
      'Descripción': programa.descripcion || 'Sin descripción',
      'Duración (años)': programa.duracion_anios || 'N/A',
      'Título Otorgado': programa.titulo_otorgado || 'N/A',
      'Modalidad': programa.modalidad || 'Sin definir',
      'Estado': programa.activo ? 'Activo' : 'Inactivo',
      'Fecha Creación': new Date(programa.fecha_creacion).toLocaleDateString()
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Programas_Academicos')
    XLSX.writeFile(wb, `programas_academicos_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Función para exportar a PDF
  const exportToPDF = () => {
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text('Listado de Programas Académicos', 14, 22)

    // Fecha
    doc.setFontSize(11)
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 32)

    // Datos de la tabla
    const tableData = filteredProgramas.map(programa => [
      programa.nombre,
      programa.descripcion || 'Sin descripción',
      `${programa.duracion_anios || 'N/A'} años`,
      programa.titulo_otorgado || 'N/A',
      programa.modalidad || 'Sin definir',
      programa.activo ? 'Activo' : 'Inactivo'
    ])

    autoTable(doc, {
      head: [['Nombre', 'Descripción', 'Duración', 'Título Otorgado', 'Modalidad', 'Estado']],
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

    doc.save(`programas_academicos_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  // Función para imprimir
  const printList = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const htmlContent = `
      <html>
        <head>
          <title>Listado de Programas Académicos</title>
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
            <h1>Listado de Programas Académicos</h1>
          </div>
          <div class="date">
            Fecha: ${new Date().toLocaleDateString()}
          </div>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Duración</th>
                <th>Título Otorgado</th>
                <th>Modalidad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${filteredProgramas.map(programa => `
                <tr>
                  <td>${programa.nombre}</td>
                  <td>${programa.descripcion || 'Sin descripción'}</td>
                  <td>${programa.duracion_anios || 'N/A'} años</td>
                  <td>${programa.titulo_otorgado || 'N/A'}</td>
                  <td>${programa.modalidad || 'Sin definir'}</td>
                  <td>${programa.activo ? 'Activo' : 'Inactivo'}</td>
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

  const handleToggleActive = async (id: number, activo: boolean) => {
    const { error } = await supabase
      .from('programas_academicos')
      .update({ activo: !activo })
      .eq('id', id)

    if (error) {
      alert('Error al actualizar programa académico: ' + error.message)
    } else {
      fetchProgramas()
    }
  }

  if (loading) return <div>Cargando...</div>

  return (
    <div className="space-y-4 bg-gray-900 dark:bg-gray-900 min-h-screen p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white dark:text-cyan-400">Programas Académicos</h2>
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
              placeholder="Buscar programas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-64 pl-10 pr-3 py-2 border border-gray-600 dark:border-gray-500 rounded-md leading-5 bg-gray-800 dark:bg-gray-700 text-white dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>

          {/* Botones para alternar vista */}
          <div className="flex bg-gray-800 dark:bg-gray-700 rounded-lg p-1 border border-gray-600 dark:border-gray-500">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all duration-200 ${
                viewMode === 'list'
                  ? 'bg-gray-700 dark:bg-gray-600 text-cyan-400 dark:text-cyan-400 shadow-sm border border-gray-500 dark:border-gray-400'
                  : 'text-gray-300 dark:text-gray-300 hover:text-white dark:hover:text-white hover:bg-gray-700 dark:hover:bg-gray-600'
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
                  ? 'bg-gray-700 dark:bg-gray-600 text-cyan-400 dark:text-cyan-400 shadow-sm border border-gray-500 dark:border-gray-400'
                  : 'text-gray-300 dark:text-gray-300 hover:text-white dark:hover:text-white hover:bg-gray-700 dark:hover:bg-gray-600'
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

          <ProgramaAcademicoForm onSuccess={fetchProgramas} showButton={false} />
        </div>
      </div>

      {viewMode === 'list' ? (
        /* Vista de Lista */
        <div className="bg-gray-800 dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Tarjeta de agregar programa académico */}
            <li className="px-6 py-4 bg-gradient-to-r from-gray-800 to-gray-700 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-cyan-500">
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center py-8 text-cyan-400 hover:text-blue-300 dark:text-cyan-400 dark:hover:text-blue-300 transition-colors"
                title="Agregar nuevo programa académico"
              >
                <svg className="w-12 h-12 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-xl font-semibold">Agregar Nuevo Programa Académico</span>
              </button>
            </li>
            {filteredProgramas.map((programa) => (
              <li key={programa.id} className="relative px-6 py-4">
                <div className="absolute top-2 right-2 flex space-x-2 z-10">
                  <button
                    onClick={() => setEditingPrograma(programa)}
                    className="p-2 text-[#01257D] hover:text-blue-900 dark:text-cyan-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                    title="Editar programa"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleToggleActive(programa.id, programa.activo)}
                    className={`p-2 rounded-md transition-colors ${
                      programa.activo
                        ? 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                        : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                    }`}
                    title={programa.activo ? 'Desactivar programa' : 'Activar programa'}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                <div className="pr-20">
                  <h3 className="text-sm font-medium text-white dark:text-white">{programa.nombre}</h3>
                  <p className="text-sm text-gray-300 dark:text-gray-400">
                    {programa.descripcion || 'Sin descripción'}
                  </p>
                  <p className="text-sm text-gray-300 dark:text-gray-400">Duración: {programa.duracion_anios || 'N/A'} años • Título: {programa.titulo_otorgado || 'N/A'}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        /* Vista de Tarjetas */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tarjeta de agregar programa académico */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-700 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-md p-6 border-2 border-dashed border-cyan-500 dark:border-cyan-600 flex items-center justify-center cursor-pointer hover:bg-gray-700 dark:hover:bg-blue-900/30 transition-colors" onClick={() => setShowCreateForm(true)} title="Agregar nuevo programa académico">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-cyan-400 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-lg font-semibold text-cyan-400 dark:text-cyan-400">Agregar Nuevo Programa Académico</span>
            </div>
          </div>
          {filteredProgramas.map((programa) => (
            <div key={programa.id} className="relative bg-gray-800 dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-600 dark:border-gray-700">
              <div className="absolute bottom-3 right-3 flex space-x-2 z-10">
                <button
                  onClick={() => setEditingPrograma(programa)}
                  className="p-2 text-[#01257D] hover:text-blue-900 dark:text-cyan-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  title="Editar programa"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleToggleActive(programa.id, programa.activo)}
                  className={`p-2 rounded-md transition-colors ${
                    programa.activo
                      ? 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
                      : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
                  }`}
                  title={programa.activo ? 'Desactivar programa' : 'Activar programa'}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-[#01257D] dark:bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {programa.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-white dark:text-white">{programa.nombre}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      programa.activo ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {programa.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium w-20">Descripción:</span>
                  <span className="truncate">{programa.descripcion || 'Sin descripción'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-300 dark:text-gray-300">
                  <span className="font-medium w-20">Duración:</span>
                  <span>{programa.duracion_anios || 'N/A'} años</span>
                </div>
                <div className="flex items-center text-sm text-gray-300 dark:text-gray-300">
                  <span className="font-medium w-20">Título:</span>
                  <span className="truncate">{programa.titulo_otorgado || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-300 dark:text-gray-300">
                  <span className="font-medium w-20">Modalidad:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    programa.modalidad === 'Presencial' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                    programa.modalidad === 'Online' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                    programa.modalidad === 'Híbrido' ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200' :
                    'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                  }`}>
                    {programa.modalidad || 'Sin definir'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de edición */}
      {editingPrograma && (
        <ProgramaAcademicoForm
          programa={editingPrograma}
          onClose={() => setEditingPrograma(null)}
          onSuccess={() => {
            setEditingPrograma(null)
            fetchProgramas()
          }}
        />
      )}

      {/* Formulario de creación */}
      {showCreateForm && (
        <ProgramaAcademicoForm
          showButton={false}
          initialOpen={true}
          onSuccess={() => {
            setShowCreateForm(false)
            fetchProgramas()
          }}
        />
      )}
    </div>
  )
}