import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

async function postToSupabaseToken(code: string, redirectTo: string | undefined) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL')
  }

  const tokenUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/token`

  const body = new URLSearchParams()
  body.set('grant_type', 'authorization_code')
  body.set('code', code)
  if (redirectTo) body.set('redirect_to', redirectTo)

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${serviceRoleKey}`,
      // Supabase token endpoint requires the `apikey` header containing the
      // service_role key (some projects also accept only this header). Include
      // it to avoid 401: "No API key found in request".
      apikey: serviceRoleKey,
    },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Supabase token endpoint returned ${res.status}: ${text}`)
  }

  const json = await res.json()
  return json
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 })
    }

    // Prefer explicit env var that was used to generate the reset link.
    const redirectToEnv = process.env.NEXT_PUBLIC_PASSWORD_RESET_REDIRECT

    // If not set, try to build a sensible default using the app url env var.
    const defaultRedirect = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/login/set-new-password`
      : undefined

    const redirectTo = redirectToEnv || defaultRedirect

    // Exchange the code for tokens using the service role key
    const tokenResp = await postToSupabaseToken(code, redirectTo)

    const { access_token, refresh_token, expires_at } = tokenResp
    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: 'No tokens returned from Supabase' }, { status: 500 })
    }

    // Set cookies server-side so the client has a session.
    const isProd = process.env.NODE_ENV === 'production'
    const sameSiteValue = isProd ? ('none' as const) : ('lax' as const)

    const maxAge = expires_at ? Math.max(0, Number(expires_at) - Math.floor(Date.now() / 1000)) : 60 * 60 * 24

    const resp = NextResponse.redirect(new URL('/login/set-new-password', url).toString())

    try {
      resp.cookies.set('sb-access-token', access_token, {
        httpOnly: true,
        sameSite: sameSiteValue,
        path: '/',
        secure: isProd,
        maxAge,
      })
      resp.cookies.set('sb-refresh-token', refresh_token, {
        httpOnly: true,
        sameSite: sameSiteValue,
        path: '/',
        secure: isProd,
        maxAge: 60 * 60 * 24 * 30,
      })
    } catch (err) {
      // If cookies cannot be set on this runtime, return tokens instead (fallback)
      console.error('[exchange] could not set cookies', err)
      return NextResponse.json({ ok: false, error: 'Could not set cookies on response' }, { status: 500 })
    }

    return resp
  } catch (err: any) {
    console.error('[exchange] error', err)
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}
