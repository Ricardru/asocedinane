import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = body?.email
    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      // For a simple server-side call we provide no-op cookie methods
      cookies: {
        get: (name: string) => null,
        set: (name: string, value: string, options?: any) => {},
        remove: (name: string, options?: any) => {},
      },
    } as any)

    // Allow an optional redirectTo in the request body, but validate origin
    const requestedRedirect = body?.redirectTo
    const envRedirect = process.env.NEXT_PUBLIC_PASSWORD_RESET_REDIRECT

    // Build allowed origins: prefer NEXT_PUBLIC_APP_URL, fallback to envRedirect origin and known dev hosts
    const allowedOrigins = new Set<string>()
    if (process.env.NEXT_PUBLIC_APP_URL) {
      try { allowedOrigins.add(new URL(process.env.NEXT_PUBLIC_APP_URL).origin) } catch (e) {}
    }
    if (envRedirect) {
      try { allowedOrigins.add(new URL(envRedirect).origin) } catch (e) {}
    }
    // Common defaults (production and localhost for dev)
    allowedOrigins.add('https://asocedinane-eta.vercel.app')
    allowedOrigins.add('http://localhost:3000')

    let redirectTo: string | undefined = undefined
    if (requestedRedirect) {
      try {
        const r = new URL(requestedRedirect)
        if (allowedOrigins.has(r.origin)) {
          redirectTo = requestedRedirect
        } else {
          // ignore unsafe redirectTo
          redirectTo = undefined
        }
      } catch (e) {
        redirectTo = undefined
      }
    } else if (envRedirect) {
      redirectTo = envRedirect
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Correo de recuperación enviado si el email existe.' }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error desconocido' }, { status: 500 })
  }
}
