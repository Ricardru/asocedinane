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

    // Opcional: redirigir al usuario a una página de tu app después de reset
    const redirectTo = process.env.NEXT_PUBLIC_PASSWORD_RESET_REDIRECT || undefined

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Correo de recuperación enviado si el email existe.' }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error desconocido' }, { status: 500 })
  }
}
