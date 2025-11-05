import React from 'react'

interface TurnoCount {
  nombre: string
  count: number
}

export default function DistributionCard({ turnos, total }: { turnos: TurnoCount[]; total: number }) {
  return (
    <div className="bg-[#0f172a] p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-white">DISTRIBUCIÓN DE ALUMNOS</h3>
      <div className="mt-4 space-y-4">
        {turnos.map(t => {
          const pct = total > 0 ? Math.round((t.count / total) * 1000) / 10 : 0
          return (
            <div key={t.nombre}>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">{t.nombre}</span>
                <span className="text-sm text-cyan-300">{t.count} alumnos ({pct}%)</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5 mt-2">
                <div className="bg-cyan-400 h-2.5 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}

        <div className="pt-4 border-t border-gray-800">
          <div className="text-sm text-gray-400">Total General:</div>
          <div className="text-3xl font-bold text-cyan-300">{total}</div>
        </div>
      </div>
    </div>
  )
}
