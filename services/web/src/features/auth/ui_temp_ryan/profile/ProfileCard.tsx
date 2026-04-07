'use client'

import { MapPin, Calendar, Shield } from 'lucide-react'
import type { User } from '@/features/auth/api/authService'
import { useState, type ChangeEvent } from 'react'

interface ProfileCardProps {
  user: User | null
  profile: {
    level: number
    levelProgress: number
    cursus: string
    coalition: string
    location: string
    since: string
  }
  initials: string
  isOwnProfile?: boolean
}

export default function ProfileCard({ user, profile, initials, isOwnProfile }: ProfileCardProps) {
  const [showEdit, setShowEdit] = useState(false)
  const [editDraft, setEditDraft] = useState({
    fullName: user?.fullName || '',
    avatarUrl: user?.avatarUrl || '',
    bio: user?.bio || '',
  })

  const handleAvatarFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        setEditDraft(d => ({ ...d, avatarUrl: result }))
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 mx-auto w-full max-w-6xl p-6">
      
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">

        {/* Left */}
        <div className="flex-1 min-w-0">

          {/* Avatar + name inline */}
          <div className="flex items-start gap-4 mb-4">
            <div className="relative flex-shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-lg font-bold text-slate-700">
                  {initials}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-white border border-gray-200 px-1.5 py-0.5 rounded-lg text-[10px] font-mono font-bold text-slate-700 shadow-sm">
                LVL {profile.level}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-bold text-slate-900">{user?.fullName ?? 'Jane Doe'}</h1>
                <span className="text-xs font-medium text-slate-400">@{user?.username ?? 'jdoe'}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0f6f6b] bg-[#8EE7E3]/20 px-2.5 py-1 rounded-full">
                  <Shield size={10} />
                  {user?.role ?? 'STUDENT'}
                </span>
                <span className="text-sm text-slate-500">{profile.cursus}</span>
              </div>
              {/* Bio inline under name */}
              {user?.bio && (
                <p className="text-sm text-slate-500 leading-relaxed">{user.bio}</p>
              )}
            </div>
          </div>

          {/* Location + joined */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 pb-4 border-b border-gray-100 mb-4">
            {profile.location && (
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                {profile.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar size={13} />
              Since {profile.since}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Coalition', value: profile.coalition },
              { label: 'Cursus',    value: profile.cursus },
              { label: 'Joined',    value: profile.since.split(' ')[0] },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-mono text-sm font-bold text-slate-900 mb-0.5">{stat.value}</div>
                <div className="text-[10px] uppercase tracking-wide text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Edit + XP */}
        <div className="sm:min-w-[180px] flex flex-col gap-2">
          {/* Keep level section aligned across own/other profiles by reserving button space. */}
          <div className="h-8">
            {isOwnProfile && (
              <button
                type="button"
                className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-slate-600 hover:bg-gray-50 transition"
                onClick={() => setShowEdit(true)}
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className="flex justify-between items-center text-sm font-mono text-slate-700">
            <span>Level {profile.level}</span>
            <span className="text-slate-400">{profile.levelProgress}%</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0f6f6b] rounded-full transition-all duration-300"
              style={{ width: `${profile.levelProgress}%` }}
            />
          </div>
          <p className="text-xs font-mono text-right text-slate-500">{profile.levelProgress} / 100 xp</p>
        </div>

      </div>

      {/* Edit Profile Modal */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm relative">
            <button
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
              onClick={() => setShowEdit(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-4 text-slate-900">Edit Profile</h2>
            <form
              className="space-y-3"
              onSubmit={e => {
                e.preventDefault()
                setShowEdit(false)
              }}
            >
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                <input
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60 text-sm"
                  value={editDraft.fullName}
                  onChange={e => setEditDraft(d => ({ ...d, fullName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Avatar</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60 text-sm file:mr-3 file:px-3 file:py-1 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 file:font-semibold"
                  onChange={handleAvatarFileChange}
                />
                <p className="mt-1 text-[11px] text-slate-400">Choose an image.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Bio</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60 text-sm"
                  rows={3}
                  value={editDraft.bio}
                  onChange={e => setEditDraft(d => ({ ...d, bio: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0f6f6b] text-white font-semibold text-sm hover:bg-[#0a5a56]"
                >
                  Save
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm hover:bg-slate-200"
                  onClick={() => setShowEdit(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}