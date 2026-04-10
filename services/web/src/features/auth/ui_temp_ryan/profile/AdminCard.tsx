'use client'

import React, { useState } from 'react'

interface AdminCardProps {
  isOwnProfile: boolean
}

export default function AdminCard({ isOwnProfile }: AdminCardProps) {


  if (!isOwnProfile) {
    return null;
  }

  const [adminUpdateForm, setAdminUpdateForm] = useState({
    userId: '',
    role: '',
    isBanned: '',
  })

  const [newUserForm, setNewUserForm] = useState({
    username: '',
    fullName: '',
    email: '',
    role: 'STUDENT',
  })

  const handleAdminUpdateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    alert(`Updated User ID: ${adminUpdateForm.userId}`)
  }

  const handleAdminCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    alert(`Created User: ${newUserForm.username}`)
  }

  const closeDropdown = () => (document.activeElement as HTMLElement)?.blur()

  const inputCls =
    'px-3 py-2 text-sm border border-slate-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-slate-800 h-9'

  const summaryCls =
    'px-3 py-2 text-sm border border-slate-200 rounded-xl bg-gray-50 hover:bg-white focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 transition text-slate-800 flex items-center justify-between cursor-pointer list-none h-9'

  const ChevronDown = () => (
    <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  )

  return (
    <div className="card bg-base-100 shadow-sm w-full">
      <div className="card-body p-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-5">
          Admin Control Panel
        </p>

        {/* Update User */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Update User</p>
          <form
            className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_auto] gap-2"
            onSubmit={handleAdminUpdateUser}
          >
            <input
              className={inputCls}
              placeholder="User ID"
              value={adminUpdateForm.userId}
              onChange={(e) => setAdminUpdateForm((p) => ({ ...p, userId: e.target.value }))}
              required
            />

            <details className="dropdown w-full">
              <summary className={summaryCls}>
                {adminUpdateForm.role || 'Role unchanged'}
                <ChevronDown />
              </summary>
              <ul className="menu dropdown-content bg-base-100 rounded-box z-10 w-full p-2 shadow-sm mt-1">
                {['', 'STUDENT', 'ADMIN'].map((v) => (
                  <li key={v}>
                    <button type="button" onClick={() => { setAdminUpdateForm((p) => ({ ...p, role: v })); closeDropdown() }}>
                      {v || 'Role unchanged'}
                    </button>
                  </li>
                ))}
              </ul>
            </details>

            <details className="dropdown w-full">
              <summary className={summaryCls}>
                {adminUpdateForm.isBanned === 'true' ? 'Ban' : adminUpdateForm.isBanned === 'false' ? 'Unban' : 'Ban unchanged'}
                <ChevronDown />
              </summary>
              <ul className="menu dropdown-content bg-base-100 rounded-box z-10 w-full p-2 shadow-sm mt-1">
                {[['', 'Ban unchanged'], ['false', 'Unban'], ['true', 'Ban']].map(([v, label]) => (
                  <li key={v}>
                    <button type="button" onClick={() => { setAdminUpdateForm((p) => ({ ...p, isBanned: v })); closeDropdown() }}>
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </details>

            <button
              type="submit"
              className="px-4 h-9 text-sm font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition focus:outline-none focus:ring-2 focus:ring-slate-800 focus:ring-offset-2 whitespace-nowrap"
            >
              Update User
            </button>
          </form>
        </div>

        <div className="border-t border-gray-100 my-5" />

        {/* Create User */}
        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Create User</p>
          <form
            className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1.5fr_1fr_auto] gap-2"
            onSubmit={handleAdminCreateUser}
          >
            <input
              className={inputCls}
              placeholder="Username"
              value={newUserForm.username}
              onChange={(e) => setNewUserForm((p) => ({ ...p, username: e.target.value }))}
              required
              minLength={3}
            />
            <input
              className={inputCls}
              placeholder="Full Name"
              value={newUserForm.fullName}
              onChange={(e) => setNewUserForm((p) => ({ ...p, fullName: e.target.value }))}
              required
            />
            <input
              className={inputCls}
              placeholder="Email"
              type="email"
              value={newUserForm.email}
              onChange={(e) => setNewUserForm((p) => ({ ...p, email: e.target.value }))}
              required
            />

            <details className="dropdown w-full">
              <summary className={summaryCls}>
                {newUserForm.role}
                <ChevronDown />
              </summary>
              <ul className="menu dropdown-content bg-base-100 rounded-box z-10 w-full p-2 shadow-sm mt-1">
                {['STUDENT', 'ADMIN'].map((v) => (
                  <li key={v}>
                    <button type="button" onClick={() => { setNewUserForm((p) => ({ ...p, role: v })); closeDropdown() }}>
                      {v}
                    </button>
                  </li>
                ))}
              </ul>
            </details>

            <button
              type="submit"
              className="px-4 h-9 text-sm font-medium rounded-xl bg-[#157169] hover:bg-[#115e59] text-white transition focus:outline-none focus:ring-2 focus:ring-[#157169] focus:ring-offset-2 whitespace-nowrap"
            >
              Create User
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}