'use client'

import { useState } from 'react'
import { PaisesList } from '@/components/PaisesList'
import { DepartamentosList } from '@/components/DepartamentosList'
import { CiudadesList } from '@/components/CiudadesList'
import { BarriosList } from '@/components/BarriosList'

export default function UbicacionesPage() {
  const [activeTab, setActiveTab] = useState<'paises' | 'departamentos' | 'ciudades' | 'barrios'>('paises')

  const tabs = [
    { id: 'paises', label: 'Países', icon: '🌍' },
    { id: 'departamentos', label: 'Departamentos', icon: '🏛️' },
    { id: 'ciudades', label: 'Ciudades', icon: '🏙️' },
    { id: 'barrios', label: 'Barrios', icon: '🏘️' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#01257D] dark:text-cyan-400">Gestión de Ubicaciones</h1>
      </div>

      {/* Pestañas */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-[#01257D] dark:border-cyan-400 text-[#01257D] dark:text-cyan-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de las pestañas */}
      <div className="mt-6">
        {activeTab === 'paises' && <PaisesList />}
        {activeTab === 'departamentos' && <DepartamentosList />}
        {activeTab === 'ciudades' && <CiudadesList />}
        {activeTab === 'barrios' && <BarriosList />}
      </div>
    </div>
  )
}