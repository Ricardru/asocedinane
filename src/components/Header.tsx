import { supabase } from '@/lib/supabase'
import { LogoutButton } from './LogoutButton'

export async function Header() {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return (
    <header className="bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Compra-Venta</h1>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-700 dark:text-gray-300 mr-4">{user.email}</span>
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  )
}