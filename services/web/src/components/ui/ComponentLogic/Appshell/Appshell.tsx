"use client"

import { useAppShell } from './context/AppShellContext'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { ReactNode } from 'react'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { isSidebarOpen, closeSidebar, searchQuery, isChatOpen } = useAppShell()
  
  return (
    <div className="min-h-screen bg-[#f9f9f9] text-slate-900 flex flex-col">
      <Header />
      <div className="flex flex-1 min-h-0">
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <main className="flex-1 flex flex-col min-h-0">
          <div className="w-full max-w-7xl px-4 mx-auto h-full flex flex-col min-h-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}