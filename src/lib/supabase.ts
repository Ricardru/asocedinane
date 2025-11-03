import { createBrowserClient, createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente para el navegador (solo usa ANON KEY)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  cookieOptions: {
    // CRÍTICO: En producción debe ser 'none' para que funcione con Vercel
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: true, // Siempre true, incluso en desarrollo
    maxAge: 60 * 60 * 24 * 7, // 7 días
  },
})

// Cliente de servidor usando ANON KEY y cookies (para rutas/app server components)
export function createServerSupabaseClient(cookieStore: any) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        const cookie = cookieStore.get(name)?.value || null
        return cookie
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set(name, value, {
            ...options,
            sameSite: 'none',
            secure: true,
          })
        } catch (error) {
          // Ignorar errores si no estamos en un contexto donde se pueden escribir cookies
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set(name, '', { 
            ...options, 
            maxAge: 0,
            sameSite: 'none',
            secure: true,
          })
        } catch (error) {
          // Ignorar errores
        }
      },
    },
  })
}

// Helper for use inside Server Actions or Route Handlers where cookie
// modifications are permitted. Pass the `cookies()` store object here and
// it will forward get/set/remove to the store. Use this when you need the
// Supabase client to persist session cookies during an action/handler.
export function createServerSupabaseClientForActions(cookieStore: any) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value || null
      },
      set(name: string, value: string, options: any) {
        // This must only be called from a Server Action or Route Handler.
        return cookieStore.set(name, value, {
          ...options,
          sameSite: 'none',
          secure: true,
        })
      },
      remove(name: string, options: any) {
        return cookieStore.set(name, '', { 
          ...options, 
          maxAge: 0,
          sameSite: 'none',
          secure: true,
        })
      },
    },
  })
}