'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/models/AuthContext'
import { useUserProfile } from '@/features/auth/hooks/useUserProfile'
import { useUserSearch } from '@/features/auth/hooks/useUserSearch'
import { useUserLookup } from '@/features/auth/hooks/useUserLookup'
import { useSessions } from '@/features/auth/hooks/useSessions'
import { useAdminUsers } from '@/features/auth/hooks/useAdminUsers'
import { useProfileEdit } from '@/features/auth/hooks/useProfileEdit'
import { useAuthActions } from '@/features/auth/hooks/useAuthActions'
import {
  extractAchievements,
  extractIntraSummary,
  extractProjects,
  extractSkills,
} from '@/features/auth/utils/intraDataParser'
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Coins,
  Loader2,
  LogIn,
  LogOut,
  RefreshCcw,
  Search,
  Shield,
  Star,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import ProfileCard from './ProfileCard'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">{children}</p>
}

function ProjectBadge({ status, score }: { status: string; score?: number | null }) {
  if (status === 'finished') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
        <CheckCircle2 size={10} strokeWidth={2.5} />
        {score !== undefined && score !== null ? `${score}%` : 'Completed'}
      </span>
    )
  }

  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
        <Loader2 size={10} className="animate-spin" strokeWidth={2.5} />
        In progress
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">
      Pending
    </span>
  )
}

function UserAvatar({ fullName, avatarUrl }: { fullName: string; avatarUrl: string | null }) {
  const initials = fullName
    .split(' ')
    .map((name) => name[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const [showImage, setShowImage] = useState(!!avatarUrl)

  if (showImage && avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={`${fullName} avatar`}
        className="w-9 h-9 rounded-full object-cover bg-slate-100"
        onError={() => setShowImage(false)}
      />
    )
  }

  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
      {initials}
    </div>
  )
}

interface ProfilePageProps {
  viewedUserId?: number
}

export default function ProfilePage({ viewedUserId }: ProfilePageProps) {
  const router = useRouter()
  const {
    user,
    isLoading: authLoading,
    hasRole,
    reloadIntraData,
    error: authError,
    clearError,
  } = useAuth()

  const { loginWith, logoutNow, refreshNow, actionLoading, actionError } = useAuthActions()

  const viewingOwnProfile = !viewedUserId || viewedUserId === user?.id

  const {
    profile,
    loading: profileLoading,
    error: profileError,
    errorStatus: profileErrorStatus,
    refetch,
  } = useUserProfile(viewedUserId, {
    skip: !user || (!!viewedUserId && viewedUserId <= 0),
  })

  const {
    query,
    setQuery,
    results,
    loading: searchLoading,
    error: searchError,
    clear: clearSearch,
  } = useUserSearch({ minChars: 1, debounceMs: 300, pageSize: 12 })

  const {
    sessions,
    loading: sessionsLoading,
    error: sessionsError,
    endingSessionId,
    endingAll,
    refresh: refreshSessions,
    endSession,
    endAllSessions,
  } = useSessions()

  const { prefetchLookup } = useUserLookup({ cacheTtlMs: 20_000 })
  const {
    saveProfile,
    deleteProfile,
    saving: profileSaving,
    deleting: profileDeleting,
    error: profileEditError,
  } = useProfileEdit()

  const {
    updateUser: adminUpdateUser,
    logoutUser: adminLogoutUser,
    deleteUser: adminDeleteUser,
    createUser: adminCreateUser,
  } = useAdminUsers()

  const [adminActionError, setAdminActionError] = useState<string | null>(null)
  const [adminActionSuccess, setAdminActionSuccess] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState({
    username: '',
    fullName: '',
    avatarUrl: '',
    bio: '',
  })

  const [adminUpdateForm, setAdminUpdateForm] = useState({
    userId: '',
    role: '',
    isBanned: '',
  })

  const [newUserForm, setNewUserForm] = useState({
    username: '',
    fullName: '',
    email: '',
    role: 'STUDENT' as 'STUDENT' | 'ADMIN',
  })

  const isAdmin = hasRole('ADMIN')
  const activeProfile = profile ?? (viewingOwnProfile ? user : null)
  const isGuest = !user
  const isLoading = authLoading || (!!user && profileLoading && !!viewedUserId)

  useEffect(() => {
    if (!user || !viewingOwnProfile) return
    void refreshSessions()
  }, [user, viewingOwnProfile, refreshSessions])

  const initials = useMemo(() => {
    if (!activeProfile) return '??'
    return activeProfile.fullName
      .split(' ')
      .map((name) => name[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [activeProfile])

  const intraSummary = activeProfile?.intraInfo ? extractIntraSummary(activeProfile.intraInfo) : null
  const projects = activeProfile?.intraInfo ? extractProjects(activeProfile.intraInfo) : []
  const achievements = activeProfile?.intraInfo ? extractAchievements(activeProfile.intraInfo) : []
  const topSkills = activeProfile?.intraInfo ? extractSkills(activeProfile.intraInfo) : []

  const joinedSince = activeProfile?.createdAt
    ? new Date(activeProfile.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Unknown'

  const profileCardData = {
    level: intraSummary?.level ?? 0,
    levelProgress: intraSummary?.levelProgress ?? 0,
    cursus: intraSummary?.activeCursus ?? 'Not linked to 42 cursus',
    coalition: intraSummary?.campus?.name ?? 'N/A',
    email: activeProfile?.email ?? '',
    location: intraSummary?.location ?? '',
    since: joinedSince,
  }

  const handleReload42 = async () => {
    clearError()
    const updated = await reloadIntraData()
    if (updated) {
      await refetch()
    }
  }

  const handleAdminLogoutUser = async (targetUserId: number) => {
    setAdminActionError(null)
    setAdminActionSuccess(null)
    const ok = await adminLogoutUser(targetUserId)
    if (ok) {
      setAdminActionSuccess(`User ${targetUserId} has been logged out from all sessions.`)
    } else {
      setAdminActionError('Failed to logout user')
    }
  }

  const handleAdminDeleteUser = async (targetUserId: number) => {
    setAdminActionError(null)
    setAdminActionSuccess(null)
    const ok = await adminDeleteUser(targetUserId)
    if (ok) {
      setAdminActionSuccess(`User ${targetUserId} deleted successfully.`)
      clearSearch()
    } else {
      setAdminActionError('Failed to delete user')
    }
  }

  const handleAdminCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAdminActionError(null)
    setAdminActionSuccess(null)

    const created = await adminCreateUser({
      username: newUserForm.username.trim(),
      fullName: newUserForm.fullName.trim(),
      email: newUserForm.email.trim(),
      role: newUserForm.role,
    })

    if (created) {
      setAdminActionSuccess(`Created user @${created.username} (${created.id}).`)
      setNewUserForm({ username: '', fullName: '', email: '', role: 'STUDENT' })
    } else {
      setAdminActionError('Failed to create user')
    }
  }

  const handleOpenUserProfile = async (targetUserId: number) => {
    // Hybrid lookup: prefetch lookup here, then navigate to canonical user profile route.
    void prefetchLookup(targetUserId)
    await router.push(`/users/${targetUserId}`)
  }

  const handleProfileEditDemo = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const payload = {
      username: editDraft.username.trim() || undefined,
      fullName: editDraft.fullName.trim() || undefined,
      avatarUrl: editDraft.avatarUrl.trim() || undefined,
      bio: editDraft.bio.trim() || undefined,
    }
    const updated = await saveProfile(payload)
    if (updated) {
      setAdminActionSuccess('Profile update demo succeeded.')
      await refetch()
    }
  }

  const handleDeleteProfileDemo = async () => {
    setAdminActionError(null)
    setAdminActionSuccess(null)
    const deleted = await deleteProfile()
    if (!deleted) {
      setAdminActionError('Failed to delete profile')
      return
    }
    router.push('/login')
  }

  const handleAdminUpdateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setAdminActionError(null)
    setAdminActionSuccess(null)

    const targetUserId = Number(adminUpdateForm.userId)
    if (!Number.isFinite(targetUserId) || targetUserId <= 0) {
      setAdminActionError('Provide a valid user id for admin update.')
      return
    }

    const payload: {
      role?: 'STUDENT' | 'ADMIN'
      isBanned?: boolean
    } = {}

    if (adminUpdateForm.role === 'STUDENT' || adminUpdateForm.role === 'ADMIN') {
      payload.role = adminUpdateForm.role
    }
    if (adminUpdateForm.isBanned === 'true') {
      payload.isBanned = true
    }
    if (adminUpdateForm.isBanned === 'false') {
      payload.isBanned = false
    }

    if (Object.keys(payload).length === 0) {
      setAdminActionError('Choose at least one admin field (role or ban state).')
      return
    }

    const updated = await adminUpdateUser(targetUserId, payload)
    if (!updated) {
      setAdminActionError('Failed to update user')
      return
    }

    setAdminActionSuccess(`Updated user @${updated.username} (${updated.id}).`)
  }

  useEffect(() => {
    if (!activeProfile) return
    setEditDraft({
      username: activeProfile.username,
      fullName: activeProfile.fullName,
      avatarUrl: activeProfile.avatarUrl ?? '',
      bio: activeProfile.bio ?? '',
    })
  }, [activeProfile])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#0f6f6b] animate-spin mx-auto" />
          <p className="text-slate-500">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (isGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#e6f7f5] to-gray-100 p-4">
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-2xl shadow-slate-200 px-10 py-10 flex flex-col items-center gap-5 max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0f6f6b] to-[#8EE7E3] flex items-center justify-center shadow-md">
            <Shield size={26} className="text-white" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Your profile awaits</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Log in with Google or 42 to unlock your full dashboard, sessions, search, and profile data.
            </p>
          </div>
          <div className="w-full space-y-3">
            <button
              onClick={() => loginWith('google')}
              className="w-full flex items-center justify-center gap-2.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 font-semibold text-sm py-3 px-6 rounded-xl transition-all"
            >
              <LogIn size={17} />
              Log in with Google
            </button>
            <button
              onClick={() => loginWith('42')}
              className="w-full flex items-center justify-center gap-2.5 bg-[#0f6f6b] hover:bg-[#0a5a56] text-white font-semibold text-sm py-3 px-6 rounded-xl transition-all shadow-md shadow-[#0f6f6b]/30"
            >
              <LogIn size={17} />
              Log in with 42
            </button>
          </div>
          <p className="text-[11px] text-slate-400 text-center">You will be redirected to your selected OAuth provider.</p>
        </div>
      </div>
    )
  }

  if (!viewingOwnProfile && profileErrorStatus === 404) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900">User not found</h2>
          <p className="text-sm text-slate-500 mt-2">The requested profile does not exist or is no longer available.</p>
          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="mt-4 px-4 py-2 text-sm font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          >
            Back to my profile
          </button>
        </Card>
      </div>
    )
  }

  if (!viewingOwnProfile && profileErrorStatus === 403) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold text-slate-900">Access denied</h2>
          <p className="text-sm text-slate-500 mt-2">You do not have permission to view this user profile.</p>
          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="mt-4 px-4 py-2 text-sm font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          >
            Back to my profile
          </button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 p-4">
      {(authError || profileError || sessionsError || searchError || adminActionError || actionError) && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-start gap-3 text-red-700">
            <AlertCircle size={18} className="mt-0.5" />
            <div className="text-sm">{authError ?? profileError ?? sessionsError ?? searchError ?? adminActionError ?? actionError}</div>
            <button
              onClick={() => {
                clearError()
                setAdminActionError(null)
              }}
              className="ml-auto text-red-500 hover:text-red-700"
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        </Card>
      )}

      {adminActionSuccess && (
        <Card className="p-4 border-emerald-200 bg-emerald-50 text-emerald-700 text-sm">{adminActionSuccess}</Card>
      )}

      <ProfileCard user={activeProfile} profile={profileCardData} initials={initials} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Correction Points',
            value: intraSummary?.correctionPoints ?? 0,
            icon: CheckCircle2,
            accent: 'text-emerald-500',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Wallet Points',
            value: intraSummary?.wallet ?? 0,
            icon: Coins,
            accent: 'text-amber-500',
            bg: 'bg-amber-50',
          },
          {
            label: 'Projects Done',
            value: intraSummary?.completedProjects ?? 0,
            icon: TrendingUp,
            accent: 'text-violet-500',
            bg: 'bg-violet-50',
          },
          {
            label: 'Achievements',
            value: achievements.length,
            icon: Star,
            accent: 'text-blue-500',
            bg: 'bg-blue-50',
          },
        ].map((metric) => (
          <Card key={metric.label} className="p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${metric.bg} flex items-center justify-center flex-shrink-0`}>
              <metric.icon size={18} className={metric.accent} strokeWidth={2} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 leading-none">{metric.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{metric.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <Card className="lg:col-span-3 p-6">
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Projects</SectionLabel>
            {viewingOwnProfile && (
              <button
                onClick={handleReload42}
                className="inline-flex items-center gap-1 text-xs text-[#0f6f6b] hover:text-[#0a5a56] font-medium"
              >
                <RefreshCcw size={12} />
                Reload 42 data
              </button>
            )}
          </div>

          {!activeProfile?.linkedWithIntra ? (
            <p className="text-sm text-slate-500">Link a 42 account to see project and achievement data.</p>
          ) : projects.length === 0 ? (
            <p className="text-sm text-slate-500">No projects found in your current 42 dataset.</p>
          ) : (
            <div className="space-y-0.5 max-h-72 overflow-y-auto">
              {projects.slice(0, 12).map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium text-slate-700">{project.name}</span>
                  <ProjectBadge status={project.status} score={project.finalMark} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2 p-6">
          <SectionLabel>Top Skills</SectionLabel>
          {topSkills.length === 0 ? (
            <p className="text-sm text-slate-500">No skills available from the current profile data.</p>
          ) : (
            <div className="space-y-3">
              {topSkills.map((skill) => (
                <div key={skill.id}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>{skill.name}</span>
                    <span>{skill.level.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#8EE7E3] to-[#0f6f6b]"
                      style={{ width: `${Math.min(skill.level * 20, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {viewingOwnProfile && (
          <Card className="p-6">
            <SectionLabel>Edit Profile</SectionLabel>
            <form className="space-y-3" onSubmit={handleProfileEditDemo}>
              <input
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60"
                placeholder="Username"
                value={editDraft.username}
                onChange={(event) => setEditDraft((prev) => ({ ...prev, username: event.target.value }))}
                minLength={3}
                maxLength={30}
              />
              <input
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60"
                placeholder="Full name"
                value={editDraft.fullName}
                onChange={(event) => setEditDraft((prev) => ({ ...prev, fullName: event.target.value }))}
              />
              <input
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60"
                placeholder="Avatar URL"
                value={editDraft.avatarUrl}
                onChange={(event) => setEditDraft((prev) => ({ ...prev, avatarUrl: event.target.value }))}
              />
              <textarea
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60"
                placeholder="Bio"
                rows={3}
                value={editDraft.bio}
                onChange={(event) => setEditDraft((prev) => ({ ...prev, bio: event.target.value }))}
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={profileSaving || profileDeleting}
                  className="px-3 py-2 text-sm font-medium rounded-xl bg-[#0f6f6b] hover:bg-[#0a5a56] text-white disabled:opacity-60"
                >
                  {profileSaving ? 'Saving...' : 'Save Profile'}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProfileDemo}
                  disabled={profileSaving || profileDeleting}
                  className="px-3 py-2 text-sm font-medium rounded-xl bg-red-600 hover:bg-red-500 text-white disabled:opacity-60"
                >
                  {profileDeleting ? 'Deleting...' : 'Delete Profile'}
                </button>
              </div>
              {profileEditError && <p className="text-xs text-red-600">{profileEditError}</p>}
            </form>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {viewingOwnProfile && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Session Management</SectionLabel>
              <button
                onClick={refreshSessions}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
              >
                <RefreshCcw size={12} />
                Refresh
              </button>
            </div>

            {sessionsLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 size={14} className="animate-spin" />
                Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-slate-500">No active sessions found.</p>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 5).map((session) => (
                  <div key={session.sessionId} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {session.browser || 'Unknown Browser'} · {session.os || 'Unknown OS'}
                        </p>
                        <p className="text-xs text-slate-500">IP: {session.ipAddress || 'N/A'}</p>
                        {session.isCurrent && <p className="text-xs text-emerald-600">Current session</p>}
                        <p className="text-xs text-slate-400 mt-1 inline-flex items-center gap-1">
                          <Calendar size={11} />
                          Expires {new Date(session.expiresAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (session.isCurrent) {
                            await logoutNow()
                            return
                          }
                          await endSession(session.sessionId)
                        }}
                        disabled={
                          endingSessionId === session.sessionId ||
                          (session.isCurrent && actionLoading === 'logout')
                        }
                        className="text-xs font-medium text-red-600 hover:text-red-700 inline-flex items-center gap-1 disabled:opacity-60"
                      >
                        <LogOut size={12} />
                        {session.isCurrent
                          ? actionLoading === 'logout'
                            ? 'Signing out...'
                            : 'Logout'
                          : endingSessionId === session.sessionId
                            ? 'Ending...'
                            : 'End'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <button
                onClick={endAllSessions}
                disabled={endingAll || actionLoading === 'logout'}
                className="text-xs font-medium text-red-600 hover:text-red-700 inline-flex items-center gap-1 disabled:opacity-60"
              >
                <Users size={12} />
                {endingAll ? 'Signing out all...' : 'Sign out from all sessions'}
              </button>
              <button
                onClick={logoutNow}
                disabled={endingAll || actionLoading === 'logout'}
                className="text-xs font-medium text-red-600 hover:text-red-700 inline-flex items-center gap-1 disabled:opacity-60"
              >
                <LogOut size={12} />
                {actionLoading === 'logout' ? 'Signing out...' : 'Logout'}
              </button>
              <button
                onClick={refreshNow}
                disabled={endingAll || actionLoading === 'refresh' || actionLoading === 'logout'}
                className="text-xs font-medium text-slate-600 hover:text-slate-800 inline-flex items-center gap-1 disabled:opacity-60"
              >
                <RefreshCcw size={12} className={actionLoading === 'refresh' ? 'animate-spin' : ''} />
                {actionLoading === 'refresh' ? 'Refreshing auth...' : 'Auth refresh'}
              </button>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <SectionLabel>User Search</SectionLabel>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by username, email, or name"
              className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="mt-4 min-h-24">
            {searchLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 size={14} className="animate-spin" />
                Searching users...
              </div>
            ) : query.trim().length === 0 ? (
              <p className="text-sm text-slate-500">Type to search for users.</p>
            ) : results.length === 0 ? (
              <p className="text-sm text-slate-500">No users found.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {results.map((resultUser) => (
                  <div key={resultUser.id} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenUserProfile(resultUser.id)}
                        className="flex items-center gap-3 min-w-0 text-left hover:bg-slate-50 rounded-lg px-1 py-1 -mx-1 -my-1 transition"
                      >
                        <UserAvatar fullName={resultUser.fullName} avatarUrl={resultUser.avatarUrl} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{resultUser.fullName}</p>
                          <p className="text-xs text-slate-500 truncate">@{resultUser.username}</p>
                        </div>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenUserProfile(resultUser.id)}
                          className="text-xs text-[#0f6f6b] hover:text-[#0a5a56] font-medium"
                        >
                          Open profile
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleAdminLogoutUser(resultUser.id)}
                              className="text-xs text-amber-700 hover:text-amber-800"
                            >
                              Force logout
                            </button>
                            <button
                              onClick={() => handleAdminDeleteUser(resultUser.id)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {isAdmin && (
        <Card className="p-6">
          <SectionLabel>Admin Update User</SectionLabel>
          <form className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5" onSubmit={handleAdminUpdateUser}>
            <input
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60"
              placeholder="User id"
              value={adminUpdateForm.userId}
              onChange={(event) => setAdminUpdateForm((prev) => ({ ...prev, userId: event.target.value }))}
              required
            />
            <select
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60"
              value={adminUpdateForm.role}
              onChange={(event) => setAdminUpdateForm((prev) => ({ ...prev, role: event.target.value }))}
            >
              <option value="">Role unchanged</option>
              <option value="STUDENT">STUDENT</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <select
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60"
              value={adminUpdateForm.isBanned}
              onChange={(event) => setAdminUpdateForm((prev) => ({ ...prev, isBanned: event.target.value }))}
            >
              <option value="">Ban unchanged</option>
              <option value="false">Unban</option>
              <option value="true">Ban</option>
            </select>
            <button
              type="submit"
              className="px-3 py-2 text-sm font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
            >
              Update User
            </button>
          </form>

          <SectionLabel>Admin Create User</SectionLabel>
          <form className="grid grid-cols-1 md:grid-cols-5 gap-3" onSubmit={handleAdminCreateUser}>
            <input
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60"
              placeholder="Username"
              value={newUserForm.username}
              onChange={(event) => setNewUserForm((prev) => ({ ...prev, username: event.target.value }))}
              required
              minLength={3}
            />
            <input
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60"
              placeholder="Full name"
              value={newUserForm.fullName}
              onChange={(event) => setNewUserForm((prev) => ({ ...prev, fullName: event.target.value }))}
              required
            />
            <input
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60"
              placeholder="Email"
              value={newUserForm.email}
              type="email"
              onChange={(event) => setNewUserForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
            <select
              className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#8EE7E3]/60"
              value={newUserForm.role}
              onChange={(event) =>
                setNewUserForm((prev) => ({
                  ...prev,
                  role: event.target.value as 'STUDENT' | 'ADMIN',
                }))
              }
            >
              <option value="STUDENT">STUDENT</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <button
              type="submit"
              className="px-3 py-2 text-sm font-medium rounded-xl bg-[#0f6f6b] hover:bg-[#0a5a56] text-white"
            >
              Create User
            </button>
          </form>
        </Card>
      )}

      {isLoading && (
        <div className="fixed bottom-4 right-4 bg-white/95 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-500 shadow-sm inline-flex items-center gap-2">
          <Loader2 size={12} className="animate-spin" />
          Syncing profile data...
        </div>
      )}
    </div>
  )
}
