'use client'

import { useState } from 'react'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch('/login/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      if (res.ok) {
        setMessage(data.message || 'Revisa tu correo para las instrucciones para restablecer la contraseña.')
      } else {
        setError(data.error || 'No se pudo enviar el correo de recuperación. Intenta más tarde.')
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            src="/logo.png"
            alt="Logo ASOCEDINANE"
            className="mx-auto h-20 w-auto mb-4"
          />
          <h2 className="mt-2 text-center text-2xl font-extrabold text-gray-900 dark:text-white">Recuperar contraseña</h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">Introduce tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Tu correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <div className="text-red-600 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/20 p-3 rounded">{error}</div>}
          {message && <div className="text-green-700 dark:text-green-300 text-sm text-center bg-green-50 dark:bg-green-900/20 p-3 rounded">{message}</div>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </div>

          <div className="text-center">
            <a href="/login" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500">Volver al inicio de sesión</a>
          </div>
        </form>
      </div>
    </div>
  )
}
