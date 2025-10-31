import { supabase } from '@/lib/supabase'
import { ClienteList } from '@/components/ClienteList'

export default async function ClientesPage() {
  console.log('Iniciando carga de clientes...')

  // Primero intentar consulta simple sin JOIN
  const { data: clientesSimples, error: errorSimple } = await supabase
    .from('clientes')
    .select('*')
    .limit(5)

  console.log('Consulta simple:', { clientesSimples, errorSimple })

  // Consulta con LEFT JOIN para incluir clientes aunque no tengan personas asociadas
  const { data: clientes, error } = await supabase
    .from('clientes')
    .select(`
      *,
      personas!left (
        nombre_completo,
        identificacion,
        tipo_identificacion,
        telefono,
        email,
        direccion,
        pais_id,
        departamento_id,
        ciudad_id,
        barrio_id
      )
    `)
    .order('created_at', { ascending: false })

  console.log('Consulta con JOIN:', { clientes, error })

  if (error) {
    console.error('Error fetching clientes:', error)
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clientes</h1>
            <p className="text-red-600 mt-4">Error al cargar clientes: {error.message}</p>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Detalles del error: {JSON.stringify(error)}</p>
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-300">Consulta simple result: {JSON.stringify(clientesSimples)}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  console.log('Clientes cargados:', clientes?.length || 0, 'registros')

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clientes</h1>
          </div>

          {clientes && clientes.length > 0 ? (
            <ClienteList clientes={clientes} />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400 text-lg">No hay clientes registrados aún.</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Crea tu primer cliente usando el botón "Nueva Persona" arriba.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}