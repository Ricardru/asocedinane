'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { ClienteForm } from './ClienteForm'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Cliente {
  id: string
  nombre?: string
  identificacion?: string
  tipo_identificacion?: string
  telefono?: string
  email?: string
  direccion?: string
  persona_id?: string
  activo: boolean
  created_at: string
  personas?: {
    nombre_completo?: string
    identificacion?: string
    tipo_identificacion?: string
    telefono?: string
    email?: string
    direccion?: string
    pais_id?: number
    departamento_id?: number
    ciudad_id?: number
    barrio_id?: number
  }
}

interface ClienteListProps {
  clientes: Cliente[]
}

export function ClienteList({ clientes }: ClienteListProps) {
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('cards')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [viewingCliente, setViewingCliente] = useState<Cliente | null>(null)

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)

      if (error) {
        alert('Error al eliminar cliente: ' + error.message)
      } else {
        window.location.reload()
      }
    }
  }

  const handleToggleActive = async (id: string, activo: boolean) => {
    const { error } = await supabase
      .from('clientes')
      .update({ activo: !activo })
      .eq('id', id)

    if (error) {
      alert('Error al actualizar cliente: ' + error.message)
    } else {
      window.location.reload()
    }
  }

  // Funciones helper para obtener datos del cliente (personas tiene prioridad)
  const getNombre = (cliente: Cliente) => cliente.personas?.nombre_completo || cliente.nombre || 'Sin nombre'
  const getIdentificacion = (cliente: Cliente) => cliente.personas?.identificacion || cliente.identificacion || 'Sin identificación'
  const getTipoIdentificacion = (cliente: Cliente) => cliente.personas?.tipo_identificacion || cliente.tipo_identificacion || 'N/A'
  const getTelefono = (cliente: Cliente) => cliente.personas?.telefono || cliente.telefono || 'Sin teléfono'
  const getEmail = (cliente: Cliente) => cliente.personas?.email || cliente.email || 'Sin email'
  const getDireccion = (cliente: Cliente) => cliente.personas?.direccion || cliente.direccion || 'Sin dirección'
  const getPais = (cliente: Cliente) => cliente.personas?.pais_id ? `País ID: ${cliente.personas.pais_id}` : 'No especificado'
  const getDepartamento = (cliente: Cliente) => cliente.personas?.departamento_id ? `Departamento ID: ${cliente.personas.departamento_id}` : 'No especificado'
  const getCiudad = (cliente: Cliente) => cliente.personas?.ciudad_id ? `Ciudad ID: ${cliente.personas.ciudad_id}` : 'No especificado'
  const getBarrio = (cliente: Cliente) => cliente.personas?.barrio_id ? `Barrio ID: ${cliente.personas.barrio_id}` : 'No especificado'

  // Filtrar clientes basándose en el término de búsqueda
  const filteredClientes = clientes.filter(cliente =>
    getNombre(cliente).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getIdentificacion(cliente).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getEmail(cliente).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getTelefono(cliente).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getDireccion(cliente).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getPais(cliente).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getDepartamento(cliente).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCiudad(cliente).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getBarrio(cliente).toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Función para exportar a Excel
  const exportToExcel = () => {
    const dataToExport = filteredClientes.map(cliente => ({
      'Nombre Completo': getNombre(cliente),
      'Tipo ID': getTipoIdentificacion(cliente),
      'Identificación': getIdentificacion(cliente),
      'Email': getEmail(cliente),
      'Teléfono': getTelefono(cliente),
      'Dirección': getDireccion(cliente),
      'País': getPais(cliente),
      'Departamento': getDepartamento(cliente),
      'Ciudad': getCiudad(cliente),
      'Barrio': getBarrio(cliente),
      'Estado': cliente.activo ? 'Activo' : 'Inactivo'
    }))

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes')
    XLSX.writeFile(wb, `clientes_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Función para exportar a PDF
  const exportToPDF = () => {
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text('Listado de Clientes', 14, 22)

    // Fecha
    doc.setFontSize(11)
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 32)

    // Datos de la tabla
    const tableData = filteredClientes.map(cliente => [
      getNombre(cliente),
      `${getTipoIdentificacion(cliente)}: ${getIdentificacion(cliente)}`,
      getEmail(cliente),
      getTelefono(cliente),
      getDireccion(cliente),
      getPais(cliente),
      getDepartamento(cliente),
      getCiudad(cliente),
      getBarrio(cliente),
      cliente.activo ? 'Activo' : 'Inactivo'
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

    doc.save(`clientes_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  // Función para imprimir
  const printList = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const htmlContent = `
      <html>
        <head>
          <title>Listado de Clientes</title>
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
            <h1>Listado de Clientes</h1>
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
                <th>País</th>
                <th>Departamento</th>
                <th>Ciudad</th>
                <th>Barrio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${filteredClientes.map(cliente => `
                <tr>
                  <td>${getNombre(cliente)}</td>
                  <td>${getTipoIdentificacion(cliente)}: ${getIdentificacion(cliente)}</td>
                  <td>${getEmail(cliente)}</td>
                  <td>${getTelefono(cliente)}</td>
                  <td>${getDireccion(cliente)}</td>
                  <td>${getPais(cliente)}</td>
                  <td>${getDepartamento(cliente)}</td>
                  <td>${getCiudad(cliente)}</td>
                  <td>${getBarrio(cliente)}</td>
                  <td>${cliente.activo ? 'Activo' : 'Inactivo'}</td>
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
    <>
      <div className="flex justify-end items-center mb-6">
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
              placeholder="Buscar clientes por nombre, ID, email, teléfono, dirección o ubicación..."
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
        </div>
      </div>

      {viewMode === 'list' ? (
        /* Vista de Lista */
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {/* Tarjeta de agregar cliente */}
            <li className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-l-4 border-blue-500">
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center py-8 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                title="Agregar nuevo cliente"
              >
                <svg className="w-12 h-12 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-xl font-semibold">Agregar Nuevo Cliente</span>
              </button>
            </li>
            {filteredClientes.map((cliente) => (
              <li key={cliente.id} className="relative">
                <div className="px-4 py-4 sm:px-6">
                  <button
                    onClick={() => setEditingCliente(cliente)}
                    className="absolute top-2 right-2 p-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors z-10"
                    title="Editar cliente"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <div className="flex items-center justify-between pr-12">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {getNombre(cliente).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {getNombre(cliente)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {getIdentificacion(cliente)} ({getTipoIdentificacion(cliente)})
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {getEmail(cliente)} | {getTelefono(cliente)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {getDireccion(cliente)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Barrio: {getBarrio(cliente)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        cliente.activo ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {cliente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleActive(cliente.id, cliente.activo)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                            cliente.activo ? 'bg-green-600' : 'bg-red-600'
                          }`}
                          title={cliente.activo ? 'Desactivar cliente' : 'Activar cliente'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              cliente.activo ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
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
          {/* Tarjeta de agregar cliente */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-md p-6 border-2 border-dashed border-blue-300 dark:border-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors" onClick={() => setShowCreateForm(true)} title="Agregar nuevo cliente">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">Agregar Nuevo Cliente</span>
            </div>
          </div>
          {filteredClientes.map((cliente) => (
            <div key={cliente.id} className="relative bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 pb-12 border border-gray-200 dark:border-gray-700">
              {/* Toggle de activo/inactivo arriba a la derecha */}
              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={() => handleToggleActive(cliente.id, cliente.activo)}
                  className={`p-2 rounded-full transition-colors ${
                    cliente.activo
                      ? 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20'
                      : 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20'
                  }`}
                  title={cliente.activo ? 'Desactivar cliente' : 'Activar cliente'}
                >
                  {cliente.activo ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="absolute bottom-2 right-2 flex space-x-1 z-10">
                <button
                  onClick={() => setViewingCliente(cliente)}
                  className="p-1.5 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors"
                  title="Ver detalles del cliente"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  onClick={() => setEditingCliente(cliente)}
                  className="p-1.5 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  title="Editar cliente"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                    {getNombre(cliente).charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{getNombre(cliente)}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      cliente.activo ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {cliente.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium w-20">ID:</span>
                  <span>{getIdentificacion(cliente)} ({getTipoIdentificacion(cliente)})</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium w-20">Email:</span>
                  <span>{getEmail(cliente) || 'No especificado'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium w-20">Teléfono:</span>
                  <span>{getTelefono(cliente) || 'No especificado'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium w-20">Dirección:</span>
                  <span className="truncate">{getDireccion(cliente) || 'No especificada'}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium w-20">Barrio:</span>
                  <span>{getBarrio(cliente)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de edición */}
      {editingCliente && (
        <ClienteForm
          cliente={editingCliente}
          onClose={() => setEditingCliente(null)}
        />
      )}

      {/* Modal de creación */}
      {showCreateForm && (
        <ClienteForm
          showButton={false}
          initialOpen={true}
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {/* Modal de vista de detalles */}
      {viewingCliente && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Detalles del Cliente</h3>

              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xl mr-4">
                    {getNombre(viewingCliente).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{getNombre(viewingCliente)}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      viewingCliente.activo ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {viewingCliente.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tipo ID
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md capitalize">
                      {getTipoIdentificacion(viewingCliente)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Identificación
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      {getIdentificacion(viewingCliente) || 'Sin identificación'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                    {getEmail(viewingCliente) || 'Sin email'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Teléfono
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                    {getTelefono(viewingCliente) || 'Sin teléfono'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Dirección
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md min-h-[60px]">
                    {getDireccion(viewingCliente) || 'Sin dirección'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      País
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      {getPais(viewingCliente)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Departamento
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      {getDepartamento(viewingCliente)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ciudad
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      {getCiudad(viewingCliente)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Barrio
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      {getBarrio(viewingCliente)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Fecha de Creación
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">
                      {new Date(viewingCliente.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      ID
                    </label>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md font-mono">
                      {viewingCliente.id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setViewingCliente(null)}
                  className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}