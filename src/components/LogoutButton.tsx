'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    try {
      setIsLoading(true)
      console.log('Iniciando logout...')

      // Limpiar cookies manualmente antes del signOut
      if (typeof window !== 'undefined') {
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
        })
      }

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Error during logout:', error)
        alert('Error al cerrar sesión: ' + error.message)
        return
      }

      console.log('Logout successful, clearing local storage and redirecting...')

      // Limpiar cualquier dato local
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }

      // Pequeña pausa para asegurar que todo se limpie
      await new Promise(resolve => setTimeout(resolve, 100))

      // Forzar recarga completa de la página para limpiar cualquier estado
      window.location.replace('/login')

    } catch (err) {
      console.error('Exception during logout:', err)
      alert('Error inesperado al cerrar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="p-2 text-[#01257D] dark:text-gray-200 hover:bg-[#00FFFF] dark:hover:bg-gray-600 hover:text-[#01257D] dark:hover:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title={isLoading ? "Cerrando sesión..." : "Cerrar Sesión"}
    >
      {isLoading ? (
        <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      )}
    </button>
  )
}