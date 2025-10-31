import { TurnoList } from '@/components/TurnoList'

export default function TurnosPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <TurnoList />
        </div>
      </div>
    </div>
  )
}
