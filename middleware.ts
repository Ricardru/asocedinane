import { createServerSupabaseClient } from '@/lib/supabase'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerSupabaseClient({
    get(name: string) {
      return request.cookies.get(name)?.value
    },
    set(name: string, value: string, options: any) {
      request.cookies.set(name, value)
      supabaseResponse = NextResponse.next({
        request,
      })
      supabaseResponse.cookies.set(name, value, {
        ...options,
        sameSite: 'none',
        secure: true,
      })
    },
    remove(name: string, options: any) {
      request.cookies.set(name, '')
      supabaseResponse = NextResponse.next({
        request,
      })
      supabaseResponse.cookies.set(name, '', { 
        ...options, 
        maxAge: 0,
        sameSite: 'none',
        secure: true,
      })
    },
  })

  // Obtener el usuario actual
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

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}