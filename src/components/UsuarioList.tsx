'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Usuario {
  id: string
  nombre_completo: string
  email: string
  rol: string
  activo: boolean
  created_at: string
}

interface UsuarioListProps {
  usuarios: Usuario[]
}

export function UsuarioList({ usuarios }: UsuarioListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id)

      if (error) {
        alert('Error al eliminar usuario: ' + error.message)
      } else {
        window.location.reload()
      }
    }
  }

  const handleToggleActive = async (id: string, activo: boolean) => {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: !activo })
      .eq('id', id)

    if (error) {
      alert('Error al actualizar usuario: ' + error.message)
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {usuarios.map((usuario) => (
          <li key={usuario.id}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {usuario.nombre_completo.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {usuario.nombre_completo}
                    </div>
                    <div className="text-sm text-gray-500">
                      {usuario.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    usuario.rol === 'admin' ? 'bg-red-100 text-red-800' :
                    usuario.rol === 'contador' ? 'bg-blue-100 text-blue-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {usuario.rol}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    usuario.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {usuario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  <button
                    onClick={() => handleToggleActive(usuario.id, usuario.activo)}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    {usuario.activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleDelete(usuario.id)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}