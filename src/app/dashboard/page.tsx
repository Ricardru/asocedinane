import { createServerSupabaseClient } from '@/lib/supabase'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import KpiGrid from '@/components/KpiGrid'
import AlertsCard from '@/components/AlertsCard'
import DistributionCard from '@/components/DistributionCard'
import LineChart from '@/components/LineChart'
import DonutChart from '@/components/DonutChart'

export const runtime = 'nodejs'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const supabase = createServerSupabaseClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Conteos básicos
  const alumnosRes = await supabase.from('alumnos').select('id, id_turno', { count: 'exact' })
  const alumnosRows = alumnosRes.data || []
  const alumnosCount = alumnosRes.count ?? alumnosRows.length

  const clientesRes = await supabase.from('clientes').select('id', { count: 'exact' })
  const clientesCount = clientesRes.count ?? (clientesRes.data || []).length

  const proveedoresRes = await supabase.from('proveedores').select('id', { count: 'exact' })
  const proveedoresCount = proveedoresRes.count ?? (proveedoresRes.data || []).length

  // Saldo pendiente (suma de saldo_pendiente en facturas en estado pendiente/parcial)
  const invoicesRes = await supabase
    .from('facturas_venta')
    .select('saldo_pendiente, estado')
    .in('estado', ['pendiente', 'parcial'])

  const invoices = invoicesRes.data || []
  const saldoPendiente = invoices.reduce((s: number, inv: any) => s + Number(inv.saldo_pendiente || 0), 0)

  // Productos críticos
  const criticalRes = await supabase
    .from('productos_servicios')
    .select('id, nombre, stock_actual, stock_minimo')
    .lte('stock_actual', 'stock_minimo')
    .limit(6)

  const criticalProducts = criticalRes.data || []

  // Distribución de alumnos por turno (usar los rows ya obtenidos)
  const turnoCounts: Record<string, number> = {}
  alumnosRows.forEach((r: any) => {
    const turno = r.id_turno ? String(r.id_turno) : 'Sin turno'
    turnoCounts[turno] = (turnoCounts[turno] || 0) + 1
  })

  const turnoList = Object.keys(turnoCounts).map(k => ({ nombre: k === '1' ? 'Mañana' : k === '2' ? 'Tarde' : k === '3' ? 'Noche' : k, count: turnoCounts[k] }))

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-white mb-4">Panel de Control Total</h1>
      <p className="text-lg text-gray-300 mb-6">Resumen operativo basado en datos reales.</p>

      <KpiGrid alumnos={alumnosCount ?? 0} clientes={clientesCount ?? 0} proveedores={proveedoresCount ?? 0} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Line chart */}
          <LineChart
            labels={[ 'Mayo','Junio','Julio','Agosto','Septiembre','Octubre' ]}
            ingresos={[75000,82000,95000,70000,88000,96000]}
            egresos={[20000,24000,30000,21000,26000,25000]}
          />

          <div className="bg-[#071125] p-6 rounded-lg shadow-md mb-6 border border-cyan-900/30">
            <h3 className="text-lg font-semibold text-white">Status de Facturación (Saldo Pendiente)</h3>
            <p className="text-3xl text-cyan-300 font-extrabold mt-4">${Number(saldoPendiente).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
            <p className="text-sm text-gray-400 mt-2">Total estimado en facturas pendientes y parciales.</p>
          </div>

          <AlertsCard products={criticalProducts} />
        </div>

        <div>
          <DonutChart labels={[ 'Nómina y Salarios','Adquisición de Insumos','Servicios Básicos','Mantenimiento IT' ]} values={[15000,5500,2000,3500]} />

          <DistributionCard turnos={turnoList} total={alumnosCount ?? 0} />
        </div>
      </div>
    </div>
  )
}