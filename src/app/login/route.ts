// app/login/route.ts (Crear este archivo)
import { createServerSupabaseClientForActions } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { email, password } = await request.json()
  const cookieStore = cookies()
  // Usar el helper que permite escribir cookies en Route Handlers
  const supabase = createServerSupabaseClientForActions(cookieStore) 

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 })
  }

  // Si es exitoso, Supabase ya escribió las cookies en el Store.
  // Ahora solo redirigimos, el middleware ya estará feliz.
  return NextResponse.json({ success: true, redirect: '/dashboard' }, { status: 200 })
}