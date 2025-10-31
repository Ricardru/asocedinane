// Alias route: mirror of /api/ser-cookie to support callers expecting /api/auth/set-cookie
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function OPTIONS() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
  return new NextResponse(null, { status: 204, headers })
}

export async function POST(req: Request) {
  console.log('[api/auth/set-cookie] incoming method POST')
  try {
    const body = await req.json()
    const { access_token, refresh_token, expires_at } = body

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: 'missing tokens' }, { status: 400 })
    }

    const isProd = process.env.NODE_ENV === 'production'

    const maxAge = expires_at ? Math.max(0, Number(expires_at) - Math.floor(Date.now()/1000)) : 60 * 60 * 24

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
      maxAge: 60 * 60 * 24 * 30,
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

export async function GET() {
  console.log('[api/auth/set-cookie] incoming method GET')
  const responseHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }
  return NextResponse.json({ ok: true, method: 'GET' }, { headers: responseHeaders })
}
