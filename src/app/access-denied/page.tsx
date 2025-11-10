"use client"

import { useRouter } from 'next/navigation'
import { useUserRole } from '@/hooks/useUserRole'

export default function AccessDenied() {
  const { role, loading, error } = useUserRole()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    )
  }

  const router = useRouter()

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Error</h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="text-blue-400 hover:text-blue-300"
          >
            Volver al Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-700">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Acceso Denegado</h1>
          <p className="text-gray-300 mb-4">
            Su rol actual es <span className="font-semibold text-yellow-400">{role || 'desconocido'}</span>.
            Este rol no tiene un dashboard asignado. Contacte al administrador para más información.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/login')}
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Volver al Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}