// app/login/api/route.ts (Crear este archivo)
import { createServerSupabaseClientForActions } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// CRÍTICO: Forzar el entorno de ejecución a Node.js
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  // Leer cookies de la request una sola vez
  const reqCookies = await cookies()

  // Colección temporal para capturar las cookies que Supabase intente escribir
  const pendingCookies: Array<{ name: string; value: string; options?: any }> = []

  // Proveedor de cookies que acepta lecturas desde request.cookies y
  // captura escrituras en `pendingCookies` para aplicarlas después en la respuesta.
  const cookieStore = {
    get(name: string) {
      try {
        return reqCookies.get(name)?.value || null
      } catch (err) {
        return null
      }
    },
    set(name: string, value: string, options: any) {
      pendingCookies.push({ name, value, options })
    },
    remove(name: string, options: any) {
      pendingCookies.push({ name, value: '', options: { ...options, maxAge: 0 } })
    },
  }

  // Usar el helper que permite escribir cookies en Route Handlers (capturadas)
  const supabase = createServerSupabaseClientForActions(cookieStore as any)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const resp = NextResponse.json({ success: false, error: error.message }, { status: 401 })
    // aplicar cookies (por si hay tokens de sesión parciales)
    for (const c of pendingCookies) {
      try { resp.cookies.set(c.name, c.value, { ...(c.options || {}), sameSite: 'none', secure: true }) } catch (e) { }
    }
    return resp
  }

  // Crear la respuesta JSON y aplicar las cookies capturadas en ella
  const resp = NextResponse.json({ success: true, redirect: '/dashboard' }, { status: 200 })
  for (const c of pendingCookies) {
    try {
      resp.cookies.set(c.name, c.value, { ...(c.options || {}), sameSite: 'none', secure: true })
    } catch (e) {
      // ignorar errores al aplicar cookies
    }
  }

  return resp
}