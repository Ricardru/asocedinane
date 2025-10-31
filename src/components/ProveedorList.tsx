'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ProveedorForm } from './ProveedorForm'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Proveedor {
  id: string
  nombre: string
  identificacion: string
  tipo_identificacion: string
  telefono: string
  email: string
  direccion: string
  activo: boolean
  created_at: string
}

interface ProveedorListProps {
  proveedores: Proveedor[]
}

export function ProveedorList({ proveedores }: ProveedorListProps) {
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
      const { error } = await supabase
        .from('proveedores')
        .delete()
        .eq('id', id)

      if (error) {
        alert('Error al eliminar proveedor: ' + error.message)
      } else {
        window.location.reload()
      }
    }
  }

  const handleToggleActive = async (id: string, activo: boolean) => {
    const { error } = await supabase
      .from('proveedores')
      .update({ activo: !activo })
      .eq('id', id)

    if (error) {
      alert('Error al actualizar proveedor: ' + error.message)
    } else {
      window.location.reload()
    }
  }

  // Filtrar proveedores basándose en el término de búsqueda
  const filteredProveedores = proveedores.filter(proveedor =>
    proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.identificacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Función para exportar a Excel
  const exportToExcel = () => {
    const dataToExport = filteredProveedores.map(proveedor => ({
      'Nombre': proveedor.nombre,
      'Tipo ID': proveedor.tipo_identificacion,
      'Identificación': proveedor.identificacion,
      'Email': proveedor.email || 'No especificado',
      'Teléfono': proveedor.telefono || 'No especificado',
      'Dirección': proveedor.direccion || 'No especificada',
      'Estado': proveedor.activo ? 'Activo' : 'Inactivo'
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Proveedores')
    XLSX.writeFile(wb, `proveedores_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Función para exportar a PDF
  const exportToPDF = () => {
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text('Listado de Proveedores', 14, 22)

    // Fecha
    doc.setFontSize(11)
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 32)

    // Datos de la tabla
    const tableData = filteredProveedores.map(proveedor => [
      proveedor.nombre,
      `${proveedor.tipo_identificacion}: ${proveedor.identificacion}`,
      proveedor.email || 'No especificado',
      proveedor.telefono || 'No especificado',
      proveedor.direccion || 'No especificada',
      proveedor.activo ? 'Activo' : 'Inactivo'
    ])

    autoTable(doc, {
      head: [['Nombre', 'Identificación', 'Email', 'Teléfono', 'Dirección', 'Estado']],
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

    doc.save(`proveedores_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  // Función para imprimir
  const printList = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const htmlContent = `
      <html>
        <head>
          <title>Listado de Proveedores</title>
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
            <h1>Listado de Proveedores</h1>
          </div>
          <div class="date">
            Fecha: ${new Date().toLocaleDateString()}
          </div>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Identificación</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Dirección</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${filteredProveedores.map(proveedor => `
                <tr>
                  <td>${proveedor.nombre}</td>
                  <td>${proveedor.tipo_identificacion}: ${proveedor.identificacion}</td>
                  <td>${proveedor.email || 'No especificado'}</td>
                  <td>${proveedor.telefono || 'No especificado'}</td>
                  <td>${proveedor.direccion || 'No especificada'}</td>
                  <td>${proveedor.activo ? 'Activo' : 'Inactivo'}</td>
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

  return (
    <div className="space-y-6">
      {/* Contenedor de controles */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        {/* Caja de búsqueda */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar proveedores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-64 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Contenedor de botones */}
        <div className="flex flex-wrap gap-4 items-center">
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
        </div>
      </div>

      {viewMode === 'list' ? (
        /* Vista de Lista */
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Tarjeta de agregar proveedor */}
            <li className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500">
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center py-8 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                title="Agregar nuevo proveedor"
              >
                <svg className="w-12 h-12 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-xl font-semibold">Agregar Nuevo Proveedor</span>
              </button>
            </li>
            {filteredProveedores.map((proveedor) => (
              <li key={proveedor.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {proveedor.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {proveedor.nombre}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {proveedor.identificacion} ({proveedor.tipo_identificacion})
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {proveedor.email} | {proveedor.telefono}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {proveedor.direccion}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        proveedor.activo ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {proveedor.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      <button
                        onClick={() => handleToggleActive(proveedor.id, proveedor.activo)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                      >
                        {proveedor.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        /* Vista de Tarjetas */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tarjeta de agregar proveedor */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-md p-6 border-2 border-dashed border-blue-300 dark:border-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" onClick={() => setShowCreateForm(true)} title="Agregar nuevo proveedor">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">Agregar Nuevo Proveedor</span>
            </div>
          </div>
          {filteredProveedores.map((proveedor) => (
            <div key={proveedor.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-[#01257D] dark:bg-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {proveedor.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{proveedor.nombre}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      proveedor.activo ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {proveedor.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium w-20">ID:</span>
                  <span>{proveedor.identificacion} ({proveedor.tipo_identificacion})</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium w-20">Email:</span>
                  <span>{proveedor.email || 'No especificado'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium w-20">Teléfono:</span>
                  <span>{proveedor.telefono || 'No especificado'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium w-20">Dirección:</span>
                  <span className="truncate">{proveedor.direccion || 'No especificada'}</span>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => handleToggleActive(proveedor.id, proveedor.activo)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  {proveedor.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de creación */}
      {showCreateForm && (
        <ProveedorForm
          showButton={false}
          initialOpen={true}
        />
      )}
    </div>
  )
}