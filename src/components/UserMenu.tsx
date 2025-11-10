"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUserRole } from '@/hooks/useUserRole'
import { supabase } from '@/lib/supabase'

export default function UserMenu() {
  const { role, loading } = useUserRole()
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [])

  if (loading) return null

  // Mostrar solo a admins
  if (role !== 'admin') return null

  return (
    <div ref={ref} className="relative inline-block text-left mr-2">
      <button
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-md text-white"
        aria-haspopup
        aria-expanded={open}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.761 0 5.303.776 7.879 2.095M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-sm">Usuarios</span>
      </button>

      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5">
          <div className="py-1">
            <Link href="/dashboard/usuarios" className="block px-4 py-2 text-sm text-white hover:bg-gray-700">Administrar Usuarios</Link>
            <Link href="/dashboard/usuarios/new" className="block px-4 py-2 text-sm text-white hover:bg-gray-700">Crear Usuario</Link>
            <button
              onClick={async () => {
                try {
                  await supabase.auth.signOut()
                } catch (e) {
                  console.error('Error signing out:', e)
                }
                router.push('/login')
              }}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-700"
            >Cerrar sesión</button>
          </div>
        </div>
      )}
    </div>
  )
}
