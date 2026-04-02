'use client'

import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '@/features/auth/models/AuthContext'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const initials = user
    ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : null

  return (
    <div ref={ref} className="relative">
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 group"
        aria-label="User menu"
      >
        {user ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-gray-300">
            {initials}
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border-2 border-gray-300">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
              <circle cx="12" cy="12" r="12" fill="#fff" />
              <circle cx="12" cy="10" r="4" stroke="#222" strokeWidth="1.5" fill="#fff" />
              <path d="M6 19c0-2.2 2.7-4 6-4s6 1.8 6 4" stroke="#222" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        )}
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-[70] overflow-hidden animate-[fade-up_0.15s_ease-out_both]">

          {/* User info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.fullName ?? 'Guest'}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email ?? ''}</p>
            <span className="mt-1 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
              {user?.role ?? 'STUDENT'}
            </span>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-[#8EE7E3]/10 hover:text-[#0f6f6b] transition-colors"
            >
              <LayoutDashboard size={16} />
              Profile
            </Link>
          </div>

          {/* Theme toggle */}
          <div className="flex justify-center py-2 border-t border-gray-100">
            <label className="flex cursor-pointer gap-2 items-center">
              {/* Sun icon - light mode */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
              </svg>
              
              <input 
                type="checkbox" 
                className="toggle theme-controller" 
                value="dark"  // When checked, applies "dark" theme
              />
              
              {/* Moon icon - dark mode */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            </label>
          </div>
          {/* Logout */}
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={async () => {
                setOpen(false)
                await logout()
                router.push('/login')
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
