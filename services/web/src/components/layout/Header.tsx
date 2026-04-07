'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { useAppShell } from '@/components/ui/ComponentLogic/Appshell/context/AppShellContext'

export default function Header() {
  const { toggleSidebar } = useAppShell()

  return (
    // Nav bar (site header)
    <header className="h-16 bg-white text-slate-900 fixed top-0 z-[60] border-b border-gray-200 w-full shadow-sm px-4 pr-2">
      <div className="max-w-7xl py-3">
        <div className="flex items-center justify-start">
          {/* Left: hamburger + brand */}
          <div className="flex items-center gap-2 justify-self-start min-w-0">
            <button
              onClick={toggleSidebar}
              className="inline-flex h-10 w-10 items-center justify-center shrink-0 rounded-full p-2 text-slate-700 hover:bg-black/5 transition"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} className="block h-5 w-5 text-slate-700" strokeWidth={2.25} />
            </button>
            <Link href="/projects" className="text-base-content text-xl font-bold inline hover:text-secondary transition-colors">
              42 overflow
            </Link>
          </div>
          {/* Search bar and user menu intentionally hidden for this version. */}
        </div>
      </div>
    </header>
  )
}