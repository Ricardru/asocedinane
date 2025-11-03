import { NextResponse } from 'next/server'

// Endpoint temporal para forzar deploy y comprobar que las rutas públicas funcionan.
export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const hasResetRedirect = !!process.env.NEXT_PUBLIC_PASSWORD_RESET_REDIRECT

    return NextResponse.json({
      ok: true,
      message: 'temporary /api/exchange endpoint',
      env: {
        hasServiceRole,
        hasSupabaseUrl,
        hasAnon,
        hasResetRedirect,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    return NextResponse.json({ ok: true, received: body ? body.slice(0, 100) : null })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err?.message || err) }, { status: 500 })
  }
}
