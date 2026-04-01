"use client"

import { useAppShell } from './context/AppShellContext'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { ReactNode } from 'react'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { isSidebarOpen, closeSidebar } = useAppShell()
  
  return (
    // h-screen + overflow-hidden locks the browser window size
    <div className="h-screen bg-[#f9f9f9] text-slate-900 flex flex-col">
      <Header />
      <div className="w-full py-6 overflow-y-auto flex-1">
            {children}
      </div>
      <div className="min-h-0">
        {/* Sidebar stays locked to the left */}
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        
      </div>
    </div>
  )
}