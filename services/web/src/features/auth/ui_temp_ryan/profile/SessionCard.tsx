
'use client'

import { Laptop, LogOut, Smartphone } from 'lucide-react'
import { useState, useCallback, useRef, useEffect } from 'react'
import type { SessionInfo } from '@/features/auth/api/authService'

interface SessionCardProps {
  sessions: SessionInfo[]
  isOwnProfile: boolean
  onLogout?: (sessionId: string) => void
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function SessionRow({
  session,
  onLogout,
}: {
  session: SessionInfo
  onLogout: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (open && rowRef.current && !rowRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  return (
    <div ref={rowRef} className="relative overflow-hidden rounded-xl border border-slate-100">
      {/* Logout button revealed behind */}
      <button
        onClick={() => onLogout(session.sessionId)}
        className="absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-[11px] font-medium rounded-r-xl transition-colors"
        style={{ width: '88px' }}
      >
        <LogOut size={20} />
        Log out
      </button>

      {/* Sliding content */}
      <div
        onClick={() => setOpen((prev) => !prev)}
        className="relative z-10 flex flex-col gap-2 bg-white px-3 py-3 cursor-pointer sm:flex-row sm:items-center sm:justify-between transition-transform duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ transform: open ? 'translateX(-88px)' : 'translateX(0)' }}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800">
            {session.browser ?? 'Unknown browser'} on {session.os ?? 'Unknown OS'}
            {session.isCurrent ? (
              <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 border border-emerald-200">
                Current
              </span>
            ) : null}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {session.ipAddress ?? 'No IP'} • Started {formatDate(session.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          {(session.deviceType ?? '').toLowerCase().includes('mobile') ? (
            <Smartphone size={14} className="text-slate-400" />
          ) : (
            <Laptop size={14} className="text-slate-400" />
          )}
          <span>{session.deviceType ?? 'Unknown device'}</span>
        </div>
      </div>
    </div>
  )
}

export default function SessionCard({ sessions, isOwnProfile, onLogout }: SessionCardProps) {
  const [localSessions, setLocalSessions] = useState(sessions)

  const handleLogout = useCallback(
    (sessionId: string) => {
      onLogout?.(sessionId)
      setLocalSessions((prev) => prev.filter((s) => s.sessionId !== sessionId))
    },
    [onLogout],
  )

  if (!isOwnProfile) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Sessions</p>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
          {localSessions.length} active
        </span>
      </div>

      <div className="space-y-2">
        {localSessions.map((session) => (
          <SessionRow key={session.sessionId} session={session} onLogout={handleLogout} />
        ))}
      </div>
    </div>
  )
}