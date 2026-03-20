import { useAppShell } from './context/AppShellContext'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import { ReactNode } from 'react'


interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  // Context tells AppShell what state everything is in
  const { isSidebarOpen, closeSidebar, searchQuery, isChatOpen } = useAppShell()
  
  return (
    <div className="bg-white">
      <Header />
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      
      {/* Main content area adjusts based on sidebar state */}
      <main className={isSidebarOpen ? 'ml-64' : 'ml-20'}>
        {children}
      </main>
    </div>
  )
}