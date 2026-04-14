"use client"

import { useAppShell } from './context/AppShellContext'
import Header from '../../../layout/Header'
import Sidebar from '../../../layout/Sidebar'
import { ReactNode } from 'react'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { isSidebarOpen, closeSidebar } = useAppShell()
  
  return (
    // h-screen + overflow-hidden locks the browser window size
    <div className="h-screen bg-[#f9f9f9] text-slate-900 flex flex-col overflow-hidden">
      
      {/* 1. Header is pushed to the top and won't shrink */}
      <div className="flex-shrink-0 z-[60]">
        <Header />
      </div>

      {/* 2. Flex row container for Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        
        {/* 3. Main content scrolls independently */}
        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
      
    </div>
  )
}