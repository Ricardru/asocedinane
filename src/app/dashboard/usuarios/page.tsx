import { createServerSupabaseClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const runtime = 'nodejs'

export default async function UsuariosPage() {
  const cookieStore = await cookies()
  const supabase = createServerSupabaseClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // verificar rol
  const rolRes = await supabase.from('usuarios').select('rol').eq('id', user.id).single()
  const rol = rolRes.data?.rol
  if (rolRes.error || rol !== 'admin') {
    redirect('/access-denied')
  }

  const res = await supabase
    .from('usuarios')
    .select('id, nombre_completo, email, rol, activo, created_at')
    .order('created_at', { ascending: false })

  const usuarios = res.data || []

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">Administración de Usuarios</h2>
        <a
          href="/dashboard/usuarios/new"
          className="inline-flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md"
        >
          Crear Usuario
        </a>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Activo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Creado</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {usuarios.map((u: any) => (
              <tr key={u.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{u.nombre_completo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{u.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{u.rol}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {u.activo ? (
                    <span className="text-green-400">Sí</span>
                  ) : (
                    <span className="text-red-400">No</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{u.created_at ? new Date(u.created_at).toLocaleString('es-ES') : '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a href={`/dashboard/usuarios/${u.id}`} className="text-cyan-400 hover:text-cyan-300">Editar</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
