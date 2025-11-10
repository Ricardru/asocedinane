import { supabase } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export default async function Home() {
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

  if (error || !userData) {
    console.error('Error obteniendo rol del usuario:', error)
    redirect('/access-denied')
  }

  // Si es admin, ir al dashboard; de lo contrario, acceso denegado
  if (userData.rol === 'admin') {
    redirect('/dashboard')
  } else {
    redirect('/access-denied')
  }
}
