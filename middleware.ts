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
      supabaseResponse.cookies.set(name, value, options)
    },
    remove(name: string, options: any) {
      request.cookies.set(name, '')
      supabaseResponse = NextResponse.next({
        request,
      })
      supabaseResponse.cookies.set(name, '', { ...options, maxAge: 0 })
    },
  })

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  // Si hay un error al obtener el usuario, asumir que no está autenticado
  const isAuthenticated = user && !userError

  if (
    !isAuthenticated &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/register')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
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
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}