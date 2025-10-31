import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerSupabaseClientForActions } from '@/lib/supabase'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createServerSupabaseClientForActions(cookieStore)

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError) {
      return NextResponse.json({ ok: false, error: 'getUser failed', detail: userError.message }, { status: 500 })
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

    return NextResponse.json({
      ok: true,
      user: userData?.user ? { id: userData.user.id, email: userData.user.email } : null,
      sampleCount,
      sampleError,
    })
  } catch (err) {
    console.error('debug-session error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
