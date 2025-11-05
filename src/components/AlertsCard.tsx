import React from 'react'

interface Product {
  id: string
  nombre: string
  stock_actual: number
  stock_minimo: number
}

export default function AlertsCard({ products }: { products: Product[] | null }) {
  return (
    <div className="bg-[#0f172a] p-6 rounded-lg shadow-md border border-red-600/30">
      <h3 className="text-lg font-semibold text-red-400">🚨 ALERTAS DE STOCK CRÍTICO</h3>
      <div className="mt-4 space-y-3">
        {(!products || products.length === 0) && (
          <div className="text-gray-400">No hay productos con stock crítico.</div>
        )}
        {(products || []).map(p => (
          <div key={p.id} className="flex items-center justify-between bg-[#071125] p-3 rounded-md border border-red-500/10">
            <div>
              <div className="font-medium text-white">{p.nombre}</div>
              <div className="text-xs text-gray-400">Stock Actual: <span className="text-red-300">{p.stock_actual}</span> (Mín: {p.stock_minimo})</div>
            </div>
            <button className="ml-4 px-3 py-1 bg-red-600 text-white rounded-md text-sm">Comprar</button>
          </div>
        ))}
      </div>
    </div>
  )
}
