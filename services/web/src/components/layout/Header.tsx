'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Search, Download, Coins, MessageCircle, Bell, Plus, Menu, X, Loader2 } from 'lucide-react'
import UserMenu from '@/components/layout/UserMenu'
import { useAppShell } from '@/components/ui/ComponentLogic/Appshell/context/AppShellContext'
import { useUserSearch } from '@/features/auth/hooks/useUserSearch'

export default function Header() {
  const { isSidebarOpen, toggleSidebar } = useAppShell()
  const { query, setQuery, results, loading, error, clear } = useUserSearch()
  const [showResults, setShowResults] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showResults])

  const handleSearch = (value: string) => {
    setQuery(value)
    setShowResults(true)
  }

  const handleClear = () => {
    clear()
    setShowResults(false)
  }

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
          <div className="flex-1 max-w-3xl" ref={searchContainerRef}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                placeholder="Search users, projects..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setShowResults(true)}
                className="w-full pl-10 pr-10 py-2.5 bg-white rounded-full text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60 border border-gray-200"
              />
              {query && (
                <button
                  onClick={handleClear}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}

              {/* Search dropdown */}
              {showResults && query && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                  {loading && (
                    <div className="p-4 text-center">
                      <Loader2 size={18} className="animate-spin mx-auto text-blue-500" />
                      <p className="text-xs text-slate-500 mt-2">Searching...</p>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 text-center">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  {!loading && results.length > 0 && (
                    <div className="max-h-96 overflow-y-auto">
                      {results.map((user) => (
                        <Link
                          key={user.id}
                          href={`/users/${user.id}`}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-gray-100 last:border-b-0"
                          onClick={() => {
                            setShowResults(false)
                            clear()
                          }}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                            {user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{user.fullName}</p>
                            <p className="text-xs text-slate-500">@{user.username}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {!loading && results.length === 0 && query && (
                    <div className="p-6 text-center">
                      <p className="text-sm text-slate-500">No users found matching "{query}"</p>
                    </div>
                  )}
                </div>
              )}
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
