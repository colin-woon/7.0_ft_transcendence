'use client'

import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { AppShellProvider, useAppShell } from '@/features/app-shell/context/AppShellContext'

function Shell({ children }: { children: React.ReactNode }) {
  const { isSidebarOpen, closeSidebar } = useAppShell()

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-slate-900 flex flex-col">

      <Header />

      {/* ── Body ── */}
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <main
          className={`flex-1 w-full px-4 py-6 transition-all duration-300 ${
            isSidebarOpen ? 'lg:ml-64' : 'ml-0'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShellProvider>
      <Shell>{children}</Shell>
    </AppShellProvider>
  )
}
