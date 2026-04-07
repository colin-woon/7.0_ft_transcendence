'use client'

import { Laptop, Smartphone } from 'lucide-react'
import type { SessionInfo } from '@/features/auth/api/authService'

interface SessionCardProps {
  sessions: SessionInfo[]
  isOwnProfile: boolean
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function SessionCard({ sessions, isOwnProfile }: SessionCardProps) {
  if (!isOwnProfile) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Sessions</p>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
          {sessions.length} active
        </span>
      </div>

      <div className="space-y-2">
        {sessions.map((session) => (
          <div
            key={session.sessionId}
            className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
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
        ))}
      </div>
    </div>
  )
}
