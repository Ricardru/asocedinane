"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          setError('Usuario no autenticado')
          setLoading(false)
          return
        }

        const { data: userData, error: roleError } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('id', user.id)
          .single()

        if (roleError) {
          setError('Error al obtener rol: ' + roleError.message)
        } else {
          setRole(userData?.rol || null)
        }
      } catch (err) {
        setError('Error inesperado: ' + (err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchUserRole()
  }, [])

  return { role, loading, error }
}