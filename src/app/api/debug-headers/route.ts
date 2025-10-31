import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Temporary debug endpoint — returns redacted headers and cookie-store diagnostics.
// IMPORTANT: keep this endpoint temporary and remove it after debugging.
export async function GET(request: Request) {
  try {
    const cookieStore: any = await cookies()

    // Raw cookie header (redacted)
    const rawCookie = request.headers.get('cookie') || null
    const redactedCookie = rawCookie
      ? rawCookie.replace(/(sb-[^=]+=)([^;\s]+)/g, "$1***")
      : null

    // Summarize headers without exposing values: return header name + length of value
    const headersSummary: Record<string, number> = {}
    for (const [k, v] of Array.from(request.headers.entries())) {
      // mask cookie header length separately
      if (k.toLowerCase() === 'cookie') {
        headersSummary[k] = v ? v.length : 0
      } else {
        headersSummary[k] = v ? v.length : 0
      }
    }

    // Inspect cookieStore shape and presence of sb tokens (do not return actual token values)
    const cookieStoreInfo: any = {
      hasGet: typeof cookieStore.get,
      hasSet: typeof cookieStore.set,
      hasRemove: typeof cookieStore.delete || typeof cookieStore.remove,
      accessToken: null as 'present' | 'absent' | 'error' | null,
      refreshToken: null as 'present' | 'absent' | 'error' | null,
    }

    try {
      const at = cookieStore.get && cookieStore.get('sb-access-token')
      cookieStoreInfo.accessToken = at ? 'present' : 'absent'
    } catch (e) {
      cookieStoreInfo.accessToken = 'error'
    }

    try {
      const rt = cookieStore.get && cookieStore.get('sb-refresh-token')
      cookieStoreInfo.refreshToken = rt ? 'present' : 'absent'
    } catch (e) {
      cookieStoreInfo.refreshToken = 'error'
    }

    return NextResponse.json({
      ok: true,
      redactedCookie,
      headersSummary,
      cookieStoreInfo,
      note: 'Temporary debug endpoint — remove after diagnosis',
    })
  } catch (err) {
    console.error('[debug-headers] error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
