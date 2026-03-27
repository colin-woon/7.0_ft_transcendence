'use client'

import { useState, createContext, useContext, ReactNode } from 'react'

interface AppShellContextType {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  isChatOpen: boolean
  openChatInbox: () => void
  closeChatInbox: () => void
}

const AppShellContext = createContext<AppShellContextType | undefined>(undefined)

export function AppShellProvider({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev)
  const closeSidebar = () => setIsSidebarOpen(false)
  const openChatInbox = () => setIsChatOpen(true)
  const closeChatInbox = () => setIsChatOpen(false)

  const value = {
    isSidebarOpen,
    toggleSidebar,
    closeSidebar,
    searchQuery,
    setSearchQuery,
    isChatOpen,
    openChatInbox,
    closeChatInbox,
  }

  return (
    <AppShellContext.Provider value={value}>
      {children}
    </AppShellContext.Provider>
  )
}

export function useAppShell() {
  const context = useContext(AppShellContext)
  if (!context) {
    throw new Error('useAppShell must be used within AppShellProvider')
  }
  return context
}