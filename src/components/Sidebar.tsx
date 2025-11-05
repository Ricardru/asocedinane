'use client'

import { useState, useRef } from 'react'
import { LogoutButton } from '@/components/LogoutButton'
import { UserProfile } from '@/components/UserProfile'

interface SidebarProps {
  children: React.ReactNode
}

export default function Sidebar({ children }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsCollapsed(false)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsCollapsed(true)
    }, 2000) // 2 seconds delay
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div
        className={`bg-gradient-to-b from-[#01257D] to-[#111439] dark:from-[#2d3748] dark:to-[#1a202c] text-white shadow-lg transition-all duration-300 overflow-y-auto ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="p-6">
          <div className="flex items-center justify-center mb-4">
            <img
              src="/logo.png"
              alt="Logo ASOCEDINANE"
              className={`h-12 w-auto ${isCollapsed ? 'mx-auto' : 'mr-3'}`}
            />
            {!isCollapsed && (
              <h2 className="text-2xl font-bold text-[#00FFFF] dark:text-cyan-400">
                ASOCEDINANE
              </h2>
            )}
          </div>
          {!isCollapsed && (
            <p className="text-sm text-[#F8F8F9] dark:text-gray-300 text-center">Panel de Control</p>
          )}
        </div>

        {/* User Profile Section */}
        <UserProfile isCollapsed={isCollapsed} />

        <nav className="mt-4">
          <div className="space-y-6">
            {/* Personas y Contactos */}
            <div>
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-[#F8F8F9] dark:text-gray-300 uppercase tracking-wider mb-2">Personas y Contactos</h3>
              )}
              <ul className="space-y-1">
                <li>
                  <a
                    href="/dashboard/personas"
                    className={`flex items-center px-4 py-2 text-[#F8F8F9] hover:bg-[#00FFFF] hover:text-[#01257D] rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? 'Personas' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {!isCollapsed && <span className="ml-3">Personas</span>}
                  </a>
                </li>

                <li>
                  <a
                    href="/dashboard/turnos"
                    className={`flex items-center px-4 py-2 text-[#F8F8F9] hover:bg-[#00FFFF] hover:text-[#01257D] rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? 'Turnos' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6m-6 4h6" />
                    </svg>
                    {!isCollapsed && <span className="ml-3">Turnos</span>}
                  </a>
                </li>

                <li>
                  <a
                    href="/dashboard/alumnos"
                    className={`flex items-center px-4 py-2 text-[#F8F8F9] hover:bg-[#00FFFF] hover:text-[#01257D] rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? 'Alumnos' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14c-4.418 0-8 1.79-8 4v1h16v-1c0-2.21-3.582-4-8-4z" />
                    </svg>
                    {!isCollapsed && <span className="ml-3">Alumnos</span>}
                  </a>
                </li>

                <li>
                  <a
                    href="/dashboard/clientes"
                    className={`flex items-center px-4 py-2 text-[#F8F8F9] hover:bg-[#00FFFF] hover:text-[#01257D] rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? 'Clientes' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {!isCollapsed && <span className="ml-3">Clientes</span>}
                  </a>
                </li>

                <li>
                  <a
                    href="/dashboard/ubicaciones"
                    className={`flex items-center px-4 py-2 text-[#F8F8F9] hover:bg-[#00FFFF] hover:text-[#01257D] rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? 'Ubicaciones' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {!isCollapsed && <span className="ml-3">Ubicaciones</span>}
                  </a>
                </li>
              </ul>
            </div>

            {/* Productos y Finanzas */}
            <div>
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-[#F8F8F9] dark:text-gray-300 uppercase tracking-wider mb-2">Productos y Finanzas</h3>
              )}
              <ul className="space-y-1">
                <li>
                  <a
                    href="/dashboard/productos"
                    className={`flex items-center px-4 py-2 text-[#F8F8F9] hover:bg-[#00FFFF] hover:text-[#01257D] rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? 'Productos/Servicios' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    {!isCollapsed && <span className="ml-3">Productos/Servicios</span>}
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard/metodos-pago"
                    className={`flex items-center px-4 py-2 text-[#F8F8F9] hover:bg-[#00FFFF] hover:text-[#01257D] rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? 'Métodos de Pago' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    {!isCollapsed && <span className="ml-3">Métodos de Pago</span>}
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard/categorias-ingresos"
                    className={`flex items-center px-4 py-2 text-[#F8F8F9] hover:bg-[#00FFFF] hover:text-[#01257D] rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? 'Categorías de Ingresos' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {!isCollapsed && <span className="ml-3">Categorías de Ingresos</span>}
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard/categorias-egresos"
                    className={`flex items-center px-4 py-2 text-[#F8F8F9] hover:bg-[#00FFFF] hover:text-[#01257D] rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? 'Categorías de Egresos' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {!isCollapsed && <span className="ml-3">Categorías de Egresos</span>}
                  </a>
                </li>
              </ul>
            </div>

            {/* Académico */}
            <div>
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-[#F8F8F9] dark:text-gray-300 uppercase tracking-wider mb-2">Académico</h3>
              )}
              <ul className="space-y-1">
                <li>
                  <a
                    href="/dashboard/programas-academicos"
                    className={`flex items-center px-4 py-2 text-[#F8F8F9] hover:bg-[#00FFFF] hover:text-[#01257D] rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? 'Programas Académicos' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {!isCollapsed && <span className="ml-3">Programas Académicos</span>}
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard/becas"
                    className={`flex items-center px-4 py-2 text-[#F8F8F9] hover:bg-[#00FFFF] hover:text-[#01257D] rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? 'Becas' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                    </svg>
                    {!isCollapsed && <span className="ml-3">Becas</span>}
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard/turnos"
                    className={`flex items-center px-4 py-2 text-[#F8F8F9] hover:bg-[#00FFFF] hover:text-[#01257D] rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? 'Turnos' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3M5 11h14M5 11v6a2 2 0 002 2h10a2 2 0 002-2v-6M5 11l7 6 7-6" />
                    </svg>
                    {!isCollapsed && <span className="ml-3">Turnos</span>}
                  </a>
                </li>
              </ul>
            </div>

            {/* Operaciones */}
            <div>
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-[#F8F8F9] dark:text-gray-300 uppercase tracking-wider mb-2">Operaciones</h3>
              )}
              <ul className="space-y-1">
                <li>
                  <a
                    href="/dashboard/ordenes-compra"
                    className={`flex items-center px-4 py-2 text-[#F8F8F9] hover:bg-[#00FFFF] hover:text-[#01257D] rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? 'Órdenes de Compra' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {!isCollapsed && <span className="ml-3">Órdenes de Compra</span>}
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard/ordenes-pago"
                    className={`flex items-center px-4 py-2 text-[#F8F8F9] hover:bg-[#00FFFF] hover:text-[#01257D] rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? 'Órdenes de Pago' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {!isCollapsed && <span className="ml-3">Órdenes de Pago</span>}
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard/facturas-venta"
                    className={`flex items-center px-4 py-2 text-[#F8F8F9] hover:bg-[#00FFFF] hover:text-[#01257D] rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? 'Facturas de Venta' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {!isCollapsed && <span className="ml-3">Facturas de Venta</span>}
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard/recibos-cobro"
                    className={`flex items-center px-4 py-2 text-[#F8F8F9] hover:bg-[#00FFFF] hover:text-[#01257D] rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? 'Recibos de Cobro' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    {!isCollapsed && <span className="ml-3">Recibos de Cobro</span>}
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard/ingresos-otros"
                    className={`flex items-center px-4 py-2 text-[#F8F8F9] hover:bg-[#00FFFF] hover:text-[#01257D] rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? 'Ingresos Otros' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {!isCollapsed && <span className="ml-3">Ingresos Otros</span>}
                  </a>
                </li>
                <li>
                  <a
                    href="/dashboard/egresos-otros"
                    className={`flex items-center px-4 py-2 text-[#F8F8F9] hover:bg-[#00FFFF] hover:text-[#01257D] rounded-lg transition-colors ${
                      isCollapsed ? 'justify-center' : ''
                    }`}
                    title={isCollapsed ? 'Egresos Otros' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-5v2m0 0v2m0-2h2m-2 0H8" />
                    </svg>
                    {!isCollapsed && <span className="ml-3">Egresos Otros</span>}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
  <main className="flex-1 p-8 bg-gray-900 relative">
        {/* Home button (always visible) */}
        <a href="/dashboard" className="absolute left-4 top-4 z-40 inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-md text-white border border-transparent hover:border-white/10 transition">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#00FFFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9.75L12 4l9 5.75V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.75z" />
          </svg>
          <span className="text-sm text-white">Panel</span>
        </a>

        {/* Logout Button - Always Visible */}
  <div className="fixed top-4 right-4 z-50 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
          <LogoutButton />
        </div>
        {children}
      </main>
    </div>
  )
}