import { SectionLabel, SettingRow } from './Primitives'
import { RefreshCcw, LogOut } from 'lucide-react'

const mockSessions = [
  {
    sessionId: 'sess-current-web',
    isCurrent: true,
    deviceType: 'Desktop',
    browser: 'Chrome',
    os: 'Linux',
    ipAddress: '192.168.0.12',
    createdAt: '2026-04-04T10:12:00.000Z',
  },
  {
    sessionId: 'sess-iphone',
    isCurrent: false,
    deviceType: 'Mobile',
    browser: 'Safari',
    os: 'iOS',
    ipAddress: '10.0.0.52',
    createdAt: '2026-04-01T18:30:00.000Z',
  },
  {
    sessionId: 'sess-macbook',
    isCurrent: false,
    deviceType: 'Desktop',
    browser: 'Firefox',
    os: 'macOS',
    ipAddress: '172.20.10.4',
    createdAt: '2026-03-28T08:50:00.000Z',
  },
]

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function SessionsTab() {
  return (
    <>
      <div className="flex items-center justify-between mt-7 mb-1">
        <h2 className="text-base font-bold text-base-content m-0">Active Sessions</h2>
        <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition">
          <RefreshCcw size={14} />
          Refresh
        </button>
      </div>
      {mockSessions.map(sess => (
        <SettingRow
          key={sess.sessionId}
          title={`${sess.deviceType} • ${sess.os} - ${sess.browser}`}
          subtitle={`IP: ${sess.ipAddress} • Logged in: ${formatDate(sess.createdAt)}`}
          right={
            sess.isCurrent ? (
              <span className="text-xs text-[#0f6f6b] font-semibold border border-[#0f6f6b]/20 bg-[#0f6f6b]/10 px-2.5 py-1 rounded-full">
                Current Device
              </span>
            ) : (
              <button className="btn btn-xs btn-outline hover:bg-red-50 hover:text-red-500 hover:border-red-200 border-base-200 text-slate-500 gap-1">
                <LogOut size={12} strokeWidth={2.5}/>
              </button>
            )
          }
        />
      ))}
      
      <SectionLabel>Session Management</SectionLabel>
      <div className="flex items-center justify-between py-4 border-b border-base-200">
        <div>
          <p className="text-sm font-medium text-red-600">Sign out from all sessions</p>
          <p className="text-xs text-base-content/50 mt-0.5">This will log you out of all devices, including this one</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors shadow-sm">
          <LogOut size={14} />
          Sign out all
        </button>
      </div>
    </>
  )
}
