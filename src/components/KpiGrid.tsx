import React from 'react'

interface Props {
  alumnos: number
  clientes: number
  proveedores: number
}

export default function KpiGrid({ alumnos, clientes, proveedores }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
      <div className="bg-[#0f172a] p-6 rounded-lg shadow-md border-l-4 border-cyan-400">
        <h3 className="text-sm font-medium text-gray-300">Alumnos</h3>
        <p className="text-3xl font-extrabold text-cyan-300 mt-2">{alumnos}</p>
        <p className="text-xs text-gray-400 mt-1">Alumnos registrados (activos)</p>
      </div>

      <div className="bg-[#0f172a] p-6 rounded-lg shadow-md border-l-4 border-cyan-400">
        <h3 className="text-sm font-medium text-gray-300">Clientes</h3>
        <p className="text-3xl font-extrabold text-cyan-300 mt-2">{clientes}</p>
        <p className="text-xs text-gray-400 mt-1">Clientes registrados</p>
      </div>

      <div className="bg-[#0f172a] p-6 rounded-lg shadow-md border-l-4 border-cyan-400">
        <h3 className="text-sm font-medium text-gray-300">Proveedores</h3>
        <p className="text-3xl font-extrabold text-cyan-300 mt-2">{proveedores}</p>
        <p className="text-xs text-gray-400 mt-1">Proveedores registrados</p>
      </div>
    </div>
  )
}
