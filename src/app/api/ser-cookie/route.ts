// src/app/api/auth/set-cookie/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function OPTIONS() {
  // Allow preflight from browsers so POST with application/json doesn't get blocked.
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  return new NextResponse(null, { status: 204, headers })
}

export async function POST(req: Request) {
  console.log('[api/ser-cookie] incoming method POST')
  try {
    const body = await req.json()
    const { access_token, refresh_token, expires_at } = body

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: 'missing tokens' }, { status: 400 })
    }

    const isProd = process.env.NODE_ENV === 'production'
    const cookieOpts = {
      httpOnly: true,
      sameSite: 'lax' as const,
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
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge,
    })

    cookieStore.set({
      name: 'sb-refresh-token',
      value: refresh_token,
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 60 * 60 * 24 * 30, // refresh token longer
    })

    const responseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    return NextResponse.json({ ok: true }, { headers: responseHeaders })
  } catch (err) {
    console.error('set-cookie error', err)
    const responseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
    return NextResponse.json({ error: 'server error' }, { status: 500, headers: responseHeaders })
  }
}

// Temporary GET handler for debugging from browser (no preflight).
export async function GET() {
  console.log('[api/ser-cookie] incoming method GET')
  const responseHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }
  return NextResponse.json({ ok: true, method: 'GET' }, { headers: responseHeaders })
}