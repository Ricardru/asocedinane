import { supabase } from '@/lib/supabase'
import { MetodoPagoList } from '@/components/MetodoPagoList'

export default async function MetodosPagoPage() {
  const { data: metodos, error } = await supabase
    .from('metodos_pago')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching metodos_pago:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Métodos de Pago</h1>
          </div>
          <MetodoPagoList metodos={metodos || []} />
        </div>
      </div>
    </div>
  )
}