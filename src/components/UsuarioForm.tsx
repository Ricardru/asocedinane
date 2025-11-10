"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Props = {
  id: string
  nombre_completo: string
  email: string
  rol: string
  activo: boolean
}

export default function UsuarioForm({ id, nombre_completo, email, rol, activo }: Props) {
  const [nombre, setNombre] = useState(nombre_completo || '')
  const [role, setRole] = useState(rol || 'vendedor')
  const [isActive, setIsActive] = useState(Boolean(activo))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('usuarios')
      .update({ nombre_completo: nombre, rol: role, activo: isActive })
      .eq('id', id)
      .select()
      .single()

    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    // Volver a la lista de usuarios
    router.push('/dashboard/usuarios')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-md shadow-md max-w-xl">
      <h3 className="text-lg font-medium text-white mb-4">Editar Usuario</h3>

      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-1">Nombre completo</label>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full px-3 py-2 rounded bg-gray-700 text-white" />
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-1">Email (no editable)</label>
        <input value={email} disabled className="w-full px-3 py-2 rounded bg-gray-700 text-gray-300" />
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-300 mb-1">Rol</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 rounded bg-gray-700 text-white">
          <option value="admin">admin</option>
          <option value="vendedor">vendedor</option>
          <option value="contador">contador</option>
        </select>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <input id="activo" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        <label htmlFor="activo" className="text-sm text-gray-300">Activo</label>
      </div>

      {error && <div className="text-red-400 mb-2">{error}</div>}

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded">
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={() => router.push('/dashboard/usuarios')} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
          Cancelar
        </button>
      </div>
    </form>
  )
}
