"use client"

import React from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function LineChart({ labels, ingresos, egresos }: { labels: string[]; ingresos: number[]; egresos: number[] }) {
  const data = {
    labels,
    datasets: [
      {
        label: 'Ingresos',
        data: ingresos,
        borderColor: '#4ade80',
        backgroundColor: 'rgba(74,222,128,0.08)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Egresos',
        data: egresos,
        borderColor: '#f87171',
        backgroundColor: 'rgba(248,113,113,0.06)',
        tension: 0.3,
        fill: true,
      },
    ],
  }

  const options: any = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#cbd5e1' } },
      tooltip: { backgroundColor: '#0f172a', titleColor: '#22d3ee', bodyColor: '#fff' },
    },
    scales: { x: { ticks: { color: '#94a3b8' } }, y: { ticks: { color: '#94a3b8' } } },
  }

  return (
    <div className="bg-[#071125] p-4 rounded-lg shadow-md mb-6">
      <div className="text-white font-semibold mb-2">Ingresos vs Egresos (últimos meses)</div>
      <div className="h-56">
        <Line data={data} options={options} />
      </div>
    </div>
  )
}
