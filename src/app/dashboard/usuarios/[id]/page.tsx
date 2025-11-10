import { createServerSupabaseClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import UsuarioForm from '@/components/UsuarioForm'

export const runtime = 'nodejs'

type Props = { params: { id: string } }

export default async function UsuarioEditPage({ params }: Props) {
  const cookieStore = await cookies()
  const supabase = createServerSupabaseClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // verificar rol del que edita
  const rolRes = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  const rol = rolRes.data?.rol
  if (rolRes.error || rol !== 'admin') redirect('/access-denied')

  const { data: usuario, error } = await supabase
    .from('usuarios')
    .select('id, nombre_completo, email, rol, activo')
    .eq('id', params.id)
    .single()

  if (error || !usuario) {
    redirect('/dashboard/usuarios')
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <UsuarioForm id={usuario.id} nombre_completo={usuario.nombre_completo} email={usuario.email} rol={usuario.rol} activo={usuario.activo} />
    </div>
  )
}
