'use client'

import Link from 'next/link'
import { Search, Download, Coins, MessageCircle, Bell, Plus, Menu } from 'lucide-react'
import UserMenu from '@/components/layout/UserMenu'
import { useAppShell } from '@/components/ui/ComponentLogic/Appshell/context/AppShellContext'

export default function Header() {
  const { isSidebarOpen, toggleSidebar, searchQuery, setSearchQuery} = useAppShell()

  return (
    <header className="bg-white text-slate-900 sticky top-0 z-[60] border-b border-gray-200 w-full shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">

          {/* Left: logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-black/5 rounded-full transition"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} className="text-slate-700" />
            </button>
            {/* <button className="p-1.5 hover:bg-black/5 rounded-full transition">
              <svg className="w-6 h-6 text-[#8EE7E3]" viewBox="0 0 20 20" fill="currentColor">
                <circle cx="10" cy="10" r="2" />
                <circle cx="4" cy="10" r="1.5" />
                <circle cx="16" cy="10" r="1.5" />
                <path d="M10 2C5.8 2 2.5 5.4 2.5 9.6c0 2.8 1.5 5.3 3.8 6.7-.2.6-.5 1.7-.2 2.6 0 0 1.4.2 3.5-1.2.7.2 1.5.3 2.4.3 4.2 0 7.5-3.4 7.5-7.6C17.5 5.4 14.2 2 10 2z" />
              </svg>
            </button> */}
            <Link href="/projects" className="text-slate-900 text-xl font-bold hidden sm:inline hover:text-[#0f6f6b] transition-colors">
              42 overflow
            </Link>
          </div>

          {/* Center: search */}
          <div className="flex-1 max-w-2xl ml-[-24px]">
            <div className="relative flex items-center justify-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
              <input
                type="text"
                placeholder="Search 42 overflow"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#f6f7f8] rounded-full text-base placeholder-gray-500 border-2 border-[#8EE7E3] shadow-inner text-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]"
                style={{ boxShadow: '0 1px 2px 0 rgba(0,0,0,0.03)' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <UserMenu />
          </div>

        </div>
      </div>
    </header>
  )
}
