'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Producto {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  tipo: string
  precio_venta: number
  precio_compra: number
  stock_actual: number
  stock_minimo: number
  activo: boolean
}

interface ProductoFormProps {
  producto?: Producto | null
  onSuccess?: () => void
  showButton?: boolean
  initialOpen?: boolean
}

export function ProductoForm({ producto, onSuccess, showButton = true, initialOpen = false }: ProductoFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    tipo: 'producto',
    precio_venta: 0,
    precio_compra: 0,
    stock_actual: 0,
    stock_minimo: 0,
    activo: true,
  })

  const isEditing = !!producto

  useEffect(() => {
    if (producto) {
      setFormData({
        codigo: producto.codigo,
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        tipo: producto.tipo,
        precio_venta: producto.precio_venta,
        precio_compra: producto.precio_compra,
        stock_actual: producto.stock_actual,
        stock_minimo: producto.stock_minimo,
        activo: producto.activo,
      })
      setIsOpen(true)
    } else if (initialOpen) {
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [producto, initialOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const submitData = {
      codigo: formData.codigo,
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      tipo: formData.tipo,
      precio_venta: formData.precio_venta,
      precio_compra: formData.precio_compra,
      stock_actual: formData.stock_actual,
      stock_minimo: formData.stock_minimo,
      activo: formData.activo,
    }

    if (isEditing && producto) {
      const { error } = await supabase
        .from('productos_servicios')
        .update(submitData)
        .eq('id', producto.id)

      if (error) {
        alert('Error al actualizar producto/servicio: ' + error.message)
      } else {
        setIsOpen(false)
        onSuccess?.()
      }
    } else {
      const { error } = await supabase
        .from('productos_servicios')
        .insert([submitData])

      if (error) {
        alert('Error al crear producto/servicio: ' + error.message)
      } else {
        setIsOpen(false)
        setFormData({
          codigo: '',
          nombre: '',
          descripcion: '',
          tipo: 'producto',
          precio_venta: 0,
          precio_compra: 0,
          stock_actual: 0,
          stock_minimo: 0,
          activo: true,
        })
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
                {isEditing ? 'Editar Producto/Servicio' : 'Nuevo Producto/Servicio'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Código
                  </label>
                  <input
                    type="text"
                    id="codigo"
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ej: PROD001"
                  />
                </div>
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    required
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre del producto o servicio"
                  />
                </div>
                <div>
                  <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    rows={3}
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Descripción detallada"
                  />
                </div>
                <div>
                  <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipo
                  </label>
                  <select
                    id="tipo"
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  >
                    <option value="producto">Producto</option>
                    <option value="servicio">Servicio</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="precio_venta" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Precio de Venta
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="precio_venta"
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    value={formData.precio_venta}
                    onChange={(e) => setFormData({ ...formData, precio_venta: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label htmlFor="precio_compra" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Precio de Compra
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="precio_compra"
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    value={formData.precio_compra}
                    onChange={(e) => setFormData({ ...formData, precio_compra: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label htmlFor="stock_actual" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stock Actual
                  </label>
                  <input
                    type="number"
                    id="stock_actual"
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    value={formData.stock_actual}
                    onChange={(e) => setFormData({ ...formData, stock_actual: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label htmlFor="stock_minimo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    id="stock_minimo"
                    className="mt-1 block w-full bg-white dark:bg-gray-700 text-black dark:text-white border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm placeholder-gray-400 dark:placeholder-gray-500"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({ ...formData, stock_minimo: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
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
                    {loading ? (isEditing ? 'Actualizando...' : 'Creando...') : (isEditing ? 'Actualizar Producto/Servicio' : 'Crear Producto/Servicio')}
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