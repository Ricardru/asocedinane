'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useTheme } from '@/components/ThemeProvider'

interface UserProfileProps {
  isCollapsed?: boolean
}

export function UserProfile({ isCollapsed = false }: UserProfileProps) {
  const [user, setUser] = useState<any>(null)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    // Obtener usuario actual
    const getUser = async () => {
      try {
        setIsLoading(true)
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
          console.error('Error getting user:', error)
          setUser(null)
        } else {
          setUser(user)
        }
      } catch (err) {
        console.error('Exception getting user:', err)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    getUser()
  }, [])

  const toggleDarkMode = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const getUserDisplayName = () => {
    if (!user) return 'Usuario'
    return user.email?.split('@')[0] || user.user_metadata?.full_name || 'Usuario'
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    return name.charAt(0).toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="px-4 py-4 border-t border-[#F8F8F9]/20 dark:border-gray-600/20">
        <div className="flex justify-center">
          <div className="w-8 h-8 bg-[#00FFFF] rounded-full flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-[#01257D] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }

  if (isCollapsed) {
    return (
      <div className="px-4 py-4 border-t border-[#F8F8F9]/20 dark:border-gray-600/20">
        <div className="flex justify-center">
          <div className="w-8 h-8 bg-[#00FFFF] rounded-full flex items-center justify-center text-[#01257D] font-bold text-sm">
            {getUserInitials()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="px-4 py-4 border-t border-[#F8F8F9]/20 dark:border-gray-600/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#00FFFF] rounded-full flex items-center justify-center text-[#01257D] font-bold">
            {getUserInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#F8F8F9] dark:text-gray-200 truncate">
              {getUserDisplayName()}
            </p>
            <p className="text-xs text-[#F8F8F9]/70 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="p-1 text-[#F8F8F9] dark:text-gray-200 hover:bg-[#00FFFF] hover:text-[#01257D] dark:hover:bg-gray-600 dark:hover:text-white rounded transition-colors"
            title="Configuraciones"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>

        {/* Menú desplegable de configuraciones */}
        {isProfileOpen && (
          <div className="mt-3 bg-[#F8F8F9]/10 dark:bg-gray-700/50 rounded-lg border border-[#F8F8F9]/20 dark:border-gray-600/30 overflow-hidden">
            <div className="p-3">
              <h4 className="text-sm font-medium text-[#F8F8F9] dark:text-gray-200 mb-3">Configuraciones</h4>

              {/* Toggle Modo Oscuro/Claro */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#F8F8F9] dark:text-gray-200">Modo oscuro</span>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    theme === 'dark' ? 'bg-[#00FFFF]' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-200 transition-transform ${
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Otras configuraciones futuras */}
              <div className="mt-3 pt-3 border-t border-[#F8F8F9]/20 dark:border-gray-600/30">
                <button className="w-full text-left text-sm text-[#F8F8F9] dark:text-gray-200 hover:text-[#00FFFF] dark:hover:text-blue-400 transition-colors py-1">
                  Editar perfil
                </button>
                <button className="w-full text-left text-sm text-[#F8F8F9] dark:text-gray-200 hover:text-[#00FFFF] dark:hover:text-blue-400 transition-colors py-1">
                  Preferencias
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}