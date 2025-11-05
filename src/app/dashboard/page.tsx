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
      {/* Barra superior mínima con icono home */}
      <div className="flex items-center justify-between mb-6">
        <a href="/dashboard" className="inline-flex items-center text-[#01257D] hover:text-indigo-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9.75L12 4l9 5.75V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.75z" />
          </svg>
          <span className="ml-2 font-semibold">Inicio</span>
        </a>
        <div className="text-sm text-gray-600">Accesos rápidos</div>
      </div>

      <h1 className="text-4xl font-bold text-[#01257D] mb-4">Bienvenido al Panel de Control</h1>
      <p className="text-lg text-[#111439] mb-6">Selecciona un acceso rápido o un módulo del menú lateral para gestionar tus datos.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Quick access cards: cada tarjeta es un enlace al módulo correspondiente */}
        <a href="/dashboard/usuarios" className="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-[#00FFFF]">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-[#01257D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A9 9 0 1118.879 6.196M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="ml-4">
              <h3 className="text-xl font-semibold text-[#01257D]">Usuarios</h3>
              <p className="text-sm text-[#111439] mt-1">Gestiona cuentas y permisos.</p>
            </div>
          </div>
        </a>

        <a href="/dashboard/clientes" className="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-[#00FFFF]">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-[#01257D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div className="ml-4">
              <h3 className="text-xl font-semibold text-[#01257D]">Clientes</h3>
              <p className="text-sm text-[#111439] mt-1">Ver y administrar clientes.</p>
            </div>
          </div>
        </a>

        <a href="/dashboard/productos" className="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-[#00FFFF]">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-[#01257D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
            </svg>
            <div className="ml-4">
              <h3 className="text-xl font-semibold text-[#01257D]">Productos</h3>
              <p className="text-sm text-[#111439] mt-1">Gestiona inventario y servicios.</p>
            </div>
          </div>
        </a>

        <a href="/dashboard/facturas-venta" className="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-[#00FFFF]">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-[#01257D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 4h6" />
            </svg>
            <div className="ml-4">
              <h3 className="text-xl font-semibold text-[#01257D]">Facturas</h3>
              <p className="text-sm text-[#111439] mt-1">Emitir y revisar facturas de venta.</p>
            </div>
          </div>
        </a>

        <a href="/dashboard/ordenes-compra" className="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-[#00FFFF]">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-[#01257D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01" />
            </svg>
            <div className="ml-4">
              <h3 className="text-xl font-semibold text-[#01257D]">Órdenes</h3>
              <p className="text-sm text-[#111439] mt-1">Órdenes de compra y pagos.</p>
            </div>
          </div>
        </a>

        <a href="/dashboard/recibos-cobro" className="block bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-[#00FFFF]">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-[#01257D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2" />
            </svg>
            <div className="ml-4">
              <h3 className="text-xl font-semibold text-[#01257D]">Cobros</h3>
              <p className="text-sm text-[#111439] mt-1">Recibos y pagos recibidos.</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  )
}