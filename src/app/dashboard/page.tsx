import { createServerSupabaseClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerSupabaseClient(cookieStore)

  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-[#01257D] mb-8">Bienvenido al Panel de Control</h1>
      <p className="text-lg text-[#111439] mb-6">Selecciona un módulo del menú lateral para gestionar tus datos.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cards de resumen o bienvenida */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#00FFFF]">
          <h3 className="text-xl font-semibold text-[#01257D]">Usuarios</h3>
          <p className="text-[#111439] mt-2">Gestiona los usuarios del sistema.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#00FFFF]">
          <h3 className="text-xl font-semibold text-[#01257D]">Clientes</h3>
          <p className="text-[#111439] mt-2">Administra la información de clientes.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#00FFFF]">
          <h3 className="text-xl font-semibold text-[#01257D]">Proveedores</h3>
          <p className="text-[#111439] mt-2">Controla los proveedores.</p>
        </div>
        {/* Agregar más cards si es necesario */}
      </div>
    </div>
  )
}