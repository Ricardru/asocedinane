import { createServerSupabaseClient } from '@/lib/supabase'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Inicializar la respuesta. Esta es la variable que modificaremos con las cookies.
  let response = NextResponse.next({
    request,
  })

  // 2. Crear el cliente de Supabase.
  // CRÍTICO: Los métodos 'set' y 'remove' DEBEN actuar sobre la variable 'response', NO sobre 'request'.
  const supabase = createServerSupabaseClient({
    get(name: string) {
      // Leer la cookie de la solicitud entrante (request.cookies.get está bien)
      return request.cookies.get(name)?.value
    },
    set(name: string, value: string, options: any) {
      // Escribir la cookie directamente en la respuesta (response)
      // ESTA ES LA CLAVE DE LA SOLUCIÓN, evitando la manipulación del request
      response.cookies.set(name, value, {
        ...options,
        sameSite: 'none', // Clave para Vercel
        secure: true,
      })
    },
    remove(name: string, options: any) {
      // Eliminar la cookie de la respuesta
      response.cookies.set(name, '', { 
        ...options, 
        maxAge: 0,
        sameSite: 'none',
        secure: true,
      })
    },
  })

  // 3. Refrescar la sesión (esto usa los métodos get/set definidos arriba)
  await supabase.auth.getUser()

  // --- LÓGICA DE AUTORIZACIÓN ---

  const {
    data: { user },
  } = await supabase.auth.getUser() 

  const isPublicRoute = 
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname === '/'

  // Si no hay usuario y no es ruta pública, redirigir a login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    console.log('[middleware] no user, redirecting to login from:', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Si hay usuario e intenta acceder a login/register, redirigir a dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    console.log('[middleware] user authenticated, redirecting to dashboard')
    return NextResponse.redirect(url)
  }

  // 4. Devolver la respuesta (que ahora incluye cualquier cookie de Supabase actualizada)
  return response 
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - archivos estáticos (.svg, .png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
