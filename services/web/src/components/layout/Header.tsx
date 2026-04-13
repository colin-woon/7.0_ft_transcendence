'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Menu, Search } from 'lucide-react'
import { useAppShell } from '@/components/ui/ComponentLogic/Appshell/context/AppShellContext'
import { useUserSearch } from '@/features/auth/hooks/useUserSearch'
import UserMenu from './UserMenu'

export default function Header() {
  const { toggleSidebar } = useAppShell()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Search users with debounced query
  const { results, loading, setQuery, query } = useUserSearch({
    minChars: 1,
    pageSize: 8,
    debounceMs: 300,
  })


  // Hide dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="h-16 bg-white text-slate-900 z-[60] border-b border-gray-200 w-full shadow-sm px-4 pr-2">
      <div className="max-w-7xl mx-auto h-full flex items-center py-3">
        <div className="flex items-center justify-between w-full">
          {/* Left: Sidebar + Brand */}
          <div className="flex items-center gap-2 min-w-0 w-auto lg:w-64 justify-start shrink-0">
            <button
              onClick={toggleSidebar}
              className="inline-flex h-10 w-10 items-center justify-center shrink-0 rounded-full p-2 text-slate-700 hover:bg-black/5 transition"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} className="block h-5 w-5 text-slate-700" strokeWidth={2.25} />
            </button>
            <Link href="/projects" className="text-base-content text-xl font-bold hidden md:inline hover:text-secondary transition-colors">
              42 overflow
            </Link>
          </div>

          {/* Center: Search bar */}
          <div className="flex-1 flex justify-center px-2 sm:px-4 lg:px-8 shrink">
            <div className="relative w-full max-w-4xl" ref={dropdownRef}>
              <div className="relative flex items-center justify-center">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                    type="text"
                    placeholder="Search users"
                    value={query}
                    onChange={e => {
                      setQuery(e.target.value)
                      setShowDropdown(true)
                    }}
                    onFocus={() => setShowDropdown(true)}
                    className="w-full h-10 px-11 text-center bg-white-100 hover:bg-slate-100 focus:bg-slate-100 border-2 border-[#0f6f6b] focus:border-[#0f6f6b] focus:ring-2 focus:ring-[#0f6f6b]/20 rounded-full text-sm text-slate-900 placeholder-slate-500 outline-none transition-all duration-200 shadow-md shadow-[#0f6f6b]/30"
                  />
              </div>
              {showDropdown && query.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-sm text-slate-500">Searching...</div>
                  ) : results.length === 0 ? (
                    <div className="p-4 text-sm text-slate-500">No users found.</div>
                  ) : (
                    results.map(user => (
                      <button
                        key={user.id}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-slate-50 text-left"
                        onClick={() => {
                          setShowDropdown(false)
                          setQuery('')
                          router.push(`/users/${user.id}`)
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                          {user.fullName
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{user.fullName}</p>
                          <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: User menu */}
          <div className="flex items-center gap-1 w-auto lg:w-64 justify-end shrink-0">
            <UserMenu />
          </div>
        </div>
      </div>
    </header>
  )
}