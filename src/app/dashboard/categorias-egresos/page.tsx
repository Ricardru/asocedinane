import { supabase } from '@/lib/supabase'
import { CategoriaEgresoList } from '@/components/CategoriaEgresoList'

export default async function CategoriasEgresosPage() {
  const { data: categorias, error } = await supabase
    .from('categorias_egresos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching categorias_egresos:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Categorías de Egresos</h1>
          </div>
          <CategoriaEgresoList categorias={categorias || []} />
        </div>
      </div>
    </div>
  )
}