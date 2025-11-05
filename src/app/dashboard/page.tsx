import { createServerSupabaseClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const runtime = 'nodejs'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerSupabaseClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Consultas principales basadas en el esquema provisto
  // 1) Alumnos activos
  const { count: alumnosCount } = await supabase
    .from('alumnos')
    .select('id', { count: 'exact', head: true })

  // 2) Clientes
  const { count: clientesCount } = await supabase
    .from('clientes')
    .select('id', { count: 'exact', head: true })

  // 3) Proveedores
  const { count: proveedoresCount } = await supabase
    .from('proveedores')
    .select('id', { count: 'exact', head: true })

  // 4) Facturas pendientes (sumar saldo_pendiente)
  const { data: pendingData } = await supabase
    .rpc('sum_saldo_pendiente', {})
    .then(r => ({ data: r.data }))

  // Fallback si no existe la función RPC, obtener sum manualmente
  let saldoPendiente = 0
  if (pendingData && pendingData.length > 0 && pendingData[0].sum !== undefined) {
    saldoPendiente = pendingData[0].sum || 0
  } else {
    const { data: invoices } = await supabase
      .from('facturas_venta')
      .select('saldo_pendiente')
      .in('estado', ['pendiente', 'parcial'])

    saldoPendiente = (invoices || []).reduce((s: number, inv: any) => s + Number(inv.saldo_pendiente || 0), 0)
  }

  // 5) Productos con stock crítico
  const { data: criticalProducts } = await supabase
    .from('productos_servicios')
    .select('id,nombre,stock_actual,stock_minimo')
    .lte('stock_actual', 'stock_minimo')
    .limit(6)

  return (
    <div className="max-w-7xl mx-auto">
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
      <p className="text-lg text-[#111439] mb-6">Resumen operativo basado en datos reales.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#00FFFF]">
          <h3 className="text-sm font-medium text-gray-500">Alumnos</h3>
          <p className="text-3xl font-bold text-[#01257D] mt-2">{alumnosCount ?? 0}</p>
          <p className="text-sm text-gray-400 mt-1">Alumnos registrados (activos)</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#00FFFF]">
          <h3 className="text-sm font-medium text-gray-500">Clientes</h3>
          <p className="text-3xl font-bold text-[#01257D] mt-2">{clientesCount ?? 0}</p>
          <p className="text-sm text-gray-400 mt-1">Clientes registrados</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#00FFFF]">
          <h3 className="text-sm font-medium text-gray-500">Proveedores</h3>
          <p className="text-3xl font-bold text-[#01257D] mt-2">{proveedoresCount ?? 0}</p>
          <p className="text-sm text-gray-400 mt-1">Proveedores registrados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-[#01257D]">Saldo pendiente (facturas)</h3>
          <p className="text-2xl font-bold text-neon-cyan mt-4">${Number(saldoPendiente).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
          <p className="text-sm text-gray-500 mt-2">Total estimado en facturas pendientes y parciales.</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-[#01257D]">Productos con stock crítico</h3>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            {(criticalProducts || []).length === 0 && <li className="text-gray-500">No hay productos críticos</li>}
            {(criticalProducts || []).map(p => (
              <li key={p.id} className="flex justify-between items-center">
                <span>{p.nombre}</span>
                <span className="font-semibold text-red-600">{p.stock_actual}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}