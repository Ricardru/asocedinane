// src/app/api/auth/set-cookie/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function OPTIONS(request: Request) {
  // Allow preflight from browsers so POST with application/json doesn't get blocked.
  // Use explicit origin (env or request Origin) and allow credentials so Set-Cookie works
  const origin = process.env.NEXT_PUBLIC_APP_URL || request.headers.get('origin') || '*'
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  }
  return new NextResponse(null, { status: 204, headers })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { access_token, refresh_token, expires_at } = body

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: 'missing tokens' }, { status: 400 })
    }

    const isProd = process.env.NODE_ENV === 'production'
    // For cross-site cookie delivery, SameSite must be 'none' and secure=true in production.
    const sameSiteValue = isProd ? ('none' as const) : ('lax' as const)
    const cookieOpts = {
      httpOnly: true,
      sameSite: sameSiteValue,
      path: '/',
      secure: isProd,
    }

    // Duración: si tienes expires_at (unix seconds) puedes calcular maxAge
    // Aquí uso maxAge de 1 día si no viene expires_at (ajusta según tu necesidad)
    const maxAge = expires_at ? Math.max(0, Number(expires_at) - Math.floor(Date.now()/1000)) : 60 * 60 * 24

    // `cookies()` can be async in some Next.js runtimes; get the store first
  const cookieStore = await cookies()

    cookieStore.set({
      name: 'sb-access-token',
      value: access_token,
      path: '/',
      httpOnly: cookieOpts.httpOnly,
      sameSite: cookieOpts.sameSite,
      secure: cookieOpts.secure,
      maxAge,
    })

    cookieStore.set({
      name: 'sb-refresh-token',
      value: refresh_token,
      path: '/',
      httpOnly: cookieOpts.httpOnly,
      sameSite: cookieOpts.sameSite,
      secure: cookieOpts.secure,
      maxAge: 60 * 60 * 24 * 30, // refresh token longer
    })

    // Return explicit CORS headers including credentials. Use request Origin if env var not set.
    const requestOrigin = req.headers.get('origin')
    const allowOrigin = process.env.NEXT_PUBLIC_APP_URL || requestOrigin || '*'
    const responseHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    }

    return NextResponse.json({ ok: true }, { headers: responseHeaders })
  } catch (err) {
    console.error('set-cookie error', err)
    const requestOrigin = req.headers?.get?.('origin')
    const allowOrigin = process.env.NEXT_PUBLIC_APP_URL || requestOrigin || '*'
    const responseHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    }
    return NextResponse.json({ error: 'server error' }, { status: 500, headers: responseHeaders })
  }
}
