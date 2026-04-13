'use client'
 
import { useState, useRef, useEffect } from 'react'
import { SectionLabel, SettingRow } from './Primitives'
import { RefreshCcw, Search, ChevronDown, X, Plus, MoreHorizontal, ShieldCheck, ShieldOff, Ban, CircleCheck, Trash2 } from 'lucide-react'
 
const mockUsers = [
  {
    userId: 'user-001',
    username: 'john_doe',
    email: 'john@example.com',
    role: 'ADMIN',
    status: 'active',
    createdAt: '2026-03-15T10:00:00.000Z',
  },
  {
    userId: 'user-002',
    username: 'jane_smith',
    email: 'jane@example.com',
    role: 'STUDENT',
    status: 'active',
    createdAt: '2026-03-20T14:30:00.000Z',
  },
  {
    userId: 'user-003',
    username: 'bob_wilson',
    email: 'bob@example.com',
    role: 'STUDENT',
    status: 'banned',
    createdAt: '2026-02-10T09:15:00.000Z',
  },
  {
    userId: 'user-004',
    username: 'alice_tan',
    email: 'alice@example.com',
    role: 'STUDENT',
    status: 'active',
    createdAt: '2026-01-05T08:00:00.000Z',
  },
  {
    userId: 'user-005',
    username: 'charlie_ng',
    email: 'charlie@example.com',
    role: 'ADMIN',
    status: 'active',
    createdAt: '2026-02-28T12:00:00.000Z',
  },
]
 
type User = typeof mockUsers[0]
 
function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
 
const inputCls =
  'px-3 py-2 text-sm border border-slate-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-slate-800 h-9 w-full'
 
// ─── Badges ───────────────────────────────────────────────────────────────────
 
function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
      status === 'banned'
        ? 'text-red-600 bg-red-50 border-red-100'
        : 'text-emerald-600 bg-emerald-50 border-emerald-100'
    }`}>
      {status === 'banned' ? 'Banned' : 'Active'}
    </span>
  )
}
 
function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
      role === 'ADMIN'
        ? 'text-violet-600 bg-violet-50 border-violet-100'
        : 'text-slate-500 bg-slate-50 border-slate-200'
    }`}>
      {role === 'ADMIN' ? 'Admin' : 'Student'}
    </span>
  )
}
 
// ─── Actions menu ─────────────────────────────────────────────────────────────
 
function ActionsMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
 
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
 
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
      >
        <MoreHorizontal size={15} />
      </button>
 
      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
          {/* View Profile */}
          <button
            onClick={() => { alert(`View profile for ${user.username}`); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
          >
            <ShieldCheck size={14} className="text-slate-400 shrink-0" />
            View profile
          </button>

          {user.role === 'STUDENT' && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <button
                onClick={() => { alert(`Promoted ${user.username} to Admin`); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
              >
                <ShieldCheck size={14} className="text-violet-500 shrink-0" />
                Promote to Admin
              </button>
            </>
          )}
 
          {user.role !== 'ADMIN' && (
            <>
              <div className="my-1 border-t border-slate-100" />

              {/* Ban / Unban */}
              {user.status === 'banned' ? (
                <button
                  onClick={() => { alert(`Unbanned ${user.username}`); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-emerald-600 hover:bg-slate-50 transition"
                >
                  <CircleCheck size={14} className="shrink-0" />
                  Unban user
                </button>
              ) : (
                <button
                  onClick={() => { alert(`Banned ${user.username}`); setOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-orange-600 hover:bg-slate-50 transition"
                >
                  <Ban size={14} className="shrink-0" />
                  Ban user
                </button>
              )}

              <div className="my-1 border-t border-slate-100" />

              <button
                onClick={() => { alert(`Deleted ${user.username}`); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <Trash2 size={14} className="shrink-0" />
                Delete account
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
 
// ─── User row ─────────────────────────────────────────────────────────────────
 
function UserRow({ user }: { user: User }) {
  return (
    <SettingRow
      title={user.username}
      subtitle={`${user.email} · ${formatDate(user.createdAt)}`}
      right={
        <div className="flex items-center gap-2">
          <RoleBadge role={user.role} />
          <StatusBadge status={user.status} />
          <ActionsMenu user={user} />
        </div>
      }
    />
  )
}
 
// ─── User Search Dropdown ─────────────────────────────────────────────────────
 
function UserSearchDropdown() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<User | null>(null)
  const ref = useRef<HTMLDivElement>(null)
 
  const filtered = mockUsers.filter(
    u =>
      u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
  )
 
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
 
  function selectUser(user: User) {
    setSelected(user)
    setQuery('')
    setOpen(false)
  }
 
  function clear() {
    setSelected(null)
    setQuery('')
  }
 
  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <div
        onClick={() => { setOpen(o => !o); setSelected(null) }}
        className="flex items-center gap-2 px-3 h-9 border border-slate-200 rounded-lg bg-gray-50 hover:bg-white cursor-pointer transition text-sm w-full"
      >
        <Search size={13} className="shrink-0 text-slate-400" />
        {selected ? (
          <span className="flex-1 text-slate-800 font-medium truncate">{selected.username}</span>
        ) : (
          <span className="flex-1 text-slate-400">Search users…</span>
        )}
        {selected ? (
          <X
            size={13}
            className="shrink-0 text-slate-400 hover:text-slate-700"
            onClick={e => { e.stopPropagation(); clear() }}
          />
        ) : (
          <ChevronDown size={13} className="shrink-0 text-slate-400" />
        )}
      </div>
 
      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
          <div className="px-3 pt-2.5 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Search size={13} className="text-slate-400 shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Name or email…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-slate-400">No users found.</li>
            ) : (
              filtered.map(user => (
                <li
                  key={user.userId}
                  onClick={() => selectUser(user)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-500 shrink-0">
                    {user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{user.username}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <RoleBadge role={user.role} />
                    <StatusBadge status={user.status} />
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
 
      {selected && (
        <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden">
          <UserRow user={selected} />
        </div>
      )}
    </div>
  )
}
 
// ─── Create User Dropdown ─────────────────────────────────────────────────────
 
function CreateUserDropdown() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ username: '', fullName: '', email: '', role: 'STUDENT' })
  const ref = useRef<HTMLDivElement>(null)
 
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
 
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    alert(`Created user: ${form.username}`)
    setForm({ username: '', fullName: '', email: '', role: 'STUDENT' })
    setOpen(false)
  }
 
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 h-7 rounded-lg bg-[#0f6f6b] hover:bg-[#115e59] text-white transition"
      >
        <Plus size={13} />
        New user
      </button>
 
      {open && (
        <div className="absolute right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-4" style={{ width: '300px' }}>
          <p className="text-sm font-semibold text-slate-700 mb-3">Create new user</p>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input className={inputCls} placeholder="Username" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} required minLength={3} />
              <input className={inputCls} placeholder="Full name" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} required />
            </div>
            <input className={inputCls} placeholder="Email address" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            <select className={inputCls} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              <option value="STUDENT">Student</option>
              <option value="ADMIN">Admin</option>
            </select>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 h-8 text-sm rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 h-8 text-sm rounded-lg bg-[#0f6f6b] hover:bg-[#115e59] text-white transition font-medium"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
 
// ─── AdminTab ─────────────────────────────────────────────────────────────────
 
export function AdminTab() {
  return (
    <>
      <div className="flex items-center justify-between mt-7 mb-3">
        <h2 className="text-base font-bold text-base-content m-0">User Management</h2>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 transition px-2 h-7 rounded-lg hover:bg-slate-100">
            <RefreshCcw size={13} />
            Refresh
          </button>
          <CreateUserDropdown />
        </div>
      </div>
 
      <UserSearchDropdown />
 
      <SectionLabel>All users</SectionLabel>
      {mockUsers.map(user => (
        <UserRow key={user.userId} user={user} />
      ))}
    </>
  )
}