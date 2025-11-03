'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SetNewPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    // Detectar token en hash (#access_token=...) o en query (?access_token=...)
    try {
      let accessToken = null
      let refreshToken = null

      if (typeof window !== 'undefined') {
        if (window.location.hash) {
          const params = new URLSearchParams(window.location.hash.replace('#', '?'))
          accessToken = params.get('access_token')
          refreshToken = params.get('refresh_token')
        }

        if (!accessToken) {
          const q = new URL(window.location.href).searchParams
          accessToken = q.get('access_token')
          refreshToken = q.get('refresh_token')
        }
      }

      if (accessToken) {
        // Establecer sesión temporalmente para permitir updateUser
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken as string }).then(() => {
          setHasToken(true)
        }).catch(() => setHasToken(true))
      }
    } catch (err) {
      // ignore
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message || 'No se pudo actualizar la contraseña.')
      } else {
        setMessage('Contraseña actualizada correctamente. Ahora puedes iniciar sesión.')
        // Opcional: limpiar hash para no reutilizar tokens
        try { history.replaceState({}, '', window.location.pathname) } catch (e) { }
      }
    } catch (err: any) {
      setError(err?.message || 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900 dark:text-white">Establecer nueva contraseña</h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">Usa el enlace que recibiste por correo para cambiar tu contraseña.</p>
        </div>

        {!hasToken && (
          <div className="text-center text-sm text-gray-700 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
            No se detectó un token de recuperación en la URL. Asegúrate de usar el enlace del correo.
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="sr-only">Nueva contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Nueva contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="confirm" className="sr-only">Confirmar contraseña</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Confirmar contraseña"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          {error && <div className="text-red-600 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded">{error}</div>}
          {message && <div className="text-green-700 dark:text-green-300 text-sm text-center bg-green-50 dark:bg-green-900/20 p-3 rounded">{message}</div>}

          <div>
            <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? 'Actualizando...' : 'Establecer contraseña'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
