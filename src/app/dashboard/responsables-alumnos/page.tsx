import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { ResponsableAlumnoList } from '@/components/ResponsableAlumnoList'

export default async function ResponsablesAlumnosPage() {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener el rol del usuario desde la tabla usuarios
  const { data: userData, error } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (error || !userData || userData.rol !== 'admin') {
    redirect('/access-denied')
  }

  return (
    <div>
      <ResponsableAlumnoList />
    </div>
  )
}