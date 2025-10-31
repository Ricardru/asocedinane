import { supabase } from '@/lib/supabase'
import { ProveedorForm } from '@/components/ProveedorForm'
import { ProveedorList } from '@/components/ProveedorList'

export default async function ProveedoresPage() {
  const { data: proveedores, error } = await supabase
    .from('proveedores')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching proveedores:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Proveedores</h1>
            <ProveedorForm />
          </div>
          <ProveedorList proveedores={proveedores || []} />
        </div>
      </div>
    </div>
  )
}