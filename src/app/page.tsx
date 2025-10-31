import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export default async function Home() {
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
