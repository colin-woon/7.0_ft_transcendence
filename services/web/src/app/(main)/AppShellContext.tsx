'use client'

import { createContext, useContext, useState } from 'react'

interface AppShellState {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  isChatOpen: boolean
  openChatInbox: () => void
  closeChatInbox: () => void
}

const AppShellContext = createContext<AppShellState | null>(null)

export function AppShellProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <AppShellContext.Provider
      value={{
        isSidebarOpen,
        toggleSidebar: () => setIsSidebarOpen((v) => !v),
        closeSidebar: () => setIsSidebarOpen(false),
        searchQuery,
        setSearchQuery,
        isChatOpen,
        openChatInbox: () => setIsChatOpen(true),
        closeChatInbox: () => setIsChatOpen(false),
      }}
    >
      {children}
    </AppShellContext.Provider>
  )
}

export function useAppShell() {
  const ctx = useContext(AppShellContext)
  if (!ctx) throw new Error('useAppShell must be used inside AppShellProvider')
  return ctx
}
