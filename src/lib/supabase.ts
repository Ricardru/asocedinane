import { createBrowserClient, createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente para el navegador (solo usa ANON KEY)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
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
      // NOTE: Next.js only allows modifying cookies inside a Server Action or
      // a Route Handler. Many server components render during normal requests
      // and cannot call `cookies().set` — attempting to do so throws the
      // runtime error you saw. To avoid that, we make set/remove no-ops here
      // when this helper is used from a plain server component. If you need to
      // write cookies (for example, to persist auth tokens), call
      // `createServerSupabaseClientForActions` from a Server Action or Route
      // Handler where cookie modifications are permitted.
      set() {
        // no-op on render path to avoid Next.js runtime error
        // caller can implement writable cookie behavior in Server Actions
        // where cookieStore.set is allowed.
        // eslint-disable-next-line no-console
        console.warn('[supabase] cookie set skipped: not in a Server Action/Route Handler')
      },
      remove() {
        // no-op
        // eslint-disable-next-line no-console
        console.warn('[supabase] cookie remove skipped: not in a Server Action/Route Handler')
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
        return cookieStore.set(name, value, options)
      },
      remove(name: string, options: any) {
        return cookieStore.set(name, '', { ...options, maxAge: 0 })
      },
    },
  })
}