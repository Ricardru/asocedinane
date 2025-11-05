"use client"

import React from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function DonutChart({ labels, values }: { labels: string[]; values: number[] }) {
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: ['#22d3ee', '#4ade80', '#fcd34d', '#e879f9'],
        hoverBackgroundColor: ['#67e8f9', '#86efac', '#fde68a', '#f0abfc'],
        borderWidth: 1,
      },
    ],
  }

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: '#cbd5e1' } } },
  }

  return (
    <div className="bg-[#071125] p-4 rounded-lg shadow-md mb-6 h-64">
      <div className="text-white font-semibold mb-2">Distribución de Egresos</div>
      <div className="h-44">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  )
}
