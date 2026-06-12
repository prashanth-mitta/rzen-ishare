import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Menu, ShieldCheck } from 'lucide-react'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-900">
            <Menu size={22}/>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
              <ShieldCheck size={12} className="text-white"/>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Rzen Ishare</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto w-full max-w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <Outlet/>
        </main>
      </div>
    </div>
  )
}
