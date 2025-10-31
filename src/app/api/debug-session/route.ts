import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClientForActions } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    // cookies() can be async in some Next.js runtimes; await to be safe
    const cookieStore: any = await cookies()

    // Read raw Cookie header (if present) to diagnose whether cookies arrive
    const rawCookieHeader = request.headers.get('cookie') || null
    // Redact token values (do not expose actual tokens). Replace any sb-* cookie value with '***'
    const redactedCookieHeader = rawCookieHeader
      ? rawCookieHeader.replace(/(sb-[^=]+=)([^;\s]+)/g, "$1***")
      : null

    // Quick diagnostics about cookieStore shape to debug runtime mismatch
    const cookieStoreInfo = {
      hasGet: typeof cookieStore.get,
      hasSet: typeof cookieStore.set,
      getResultType: null as string | null,
    }

    // include the redacted raw header for extra visibility
    if (redactedCookieHeader) (cookieStoreInfo as any).rawCookieHeader = redactedCookieHeader

    try {
      const r = cookieStore.get && cookieStore.get('sb-access-token')
      cookieStoreInfo.getResultType = r ? typeof r : null
    } catch (e) {
      cookieStoreInfo.getResultType = 'error'
    }

  const supabase = createServerSupabaseClientForActions(cookieStore)
  const deployedSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || null

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) {
      // Include cookie diagnostics even when getUser fails so we can see what cookies
      // the server received and why the auth session is missing.
      return NextResponse.json(
        { ok: false, error: 'getUser failed', detail: userError.message, cookieStoreInfo, deployedSha },
        { status: 500 },
      )
    }

    // small DB check (non-sensitive): count personas rows (limit 1)
    let sampleCount = null
    let sampleError = null
    try {
      const { data: sample, error } = await supabase.from('personas').select('id').limit(1)
      if (error) sampleError = error.message
      else sampleCount = Array.isArray(sample) ? sample.length : 0
    } catch (e) {
      sampleError = String(e)
    }

    // Report presence of Supabase env variables (booleans only) to help debug
    const envInfo = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }

    return NextResponse.json({
      ok: true,
      cookieStoreInfo,
      envInfo,
      deployedSha,
      user: userData?.user ? { id: userData.user.id, email: userData.user.email } : null,
      sampleCount,
      sampleError,
    })
  } catch (err) {
    console.error('debug-session error', err)
    const deployedSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || null
    return NextResponse.json({ ok: false, error: String(err), deployedSha }, { status: 500 })
  }
}
