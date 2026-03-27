'use client'

import { useAuth } from '@/features/auth/models/AuthContext'
import { useUserProfile } from '@/features/auth/hooks/useUserProfile'
import {
  CheckCircle2, AlertCircle, Loader2,
  Monitor, Star, TrendingUp, Mail,
  MapPin, Calendar, Shield, LogIn, Zap,
} from 'lucide-react'
import {
  extractIntraSummary,
  extractProjects,
  extractAchievements,
  extractLevelProgress,
  extractSkills,
} from '@/features/auth/utils/intraDataParser'

// ── Sub-components ─────────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3">
      {children}
    </p>
  )
}

function ProjectBadge({ status, score }: { status: string; score?: number | null }) {
  const statusMap: Record<string, { bg: string; text: string; icon: any }> = {
    finished: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
    in_progress: { bg: 'bg-blue-50', text: 'text-blue-600', icon: Loader2 },
    waiting: { bg: 'bg-slate-50', text: 'text-slate-600', icon: AlertCircle },
    failed: { bg: 'bg-red-50', text: 'text-red-600', icon: AlertCircle },
  }

  const config = statusMap[status] || statusMap.waiting
  const Icon = config.icon

  const displayText = status === 'finished' && score !== null ? `${score}%` : status.replace('_', ' ')

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${config.text} ${config.bg} border border-current/20 px-2.5 py-0.5 rounded-full`}>
      <Icon size={10} strokeWidth={2.5} />
      {displayText}
    </span>
  )
}

function LoadingCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="animate-pulse">
        <div className="h-32 bg-gradient-to-r from-slate-200 to-slate-100" />
        <div className="p-6 space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/2" />
          <div className="h-4 bg-slate-200 rounded" />
        </div>
      </div>
    </div>
  )
}

function ErrorAlert({ title, message }: { title: string; message: string }) {
  return (
    <Card className="p-6 border-red-200 bg-red-50">
      <div className="flex gap-4">
        <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
        <div>
          <h3 className="font-semibold text-red-900">{title}</h3>
          <p className="text-sm text-red-700 mt-1">{message}</p>
        </div>
      </div>
    </Card>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, isLoading: authLoading, mockLogin } = useAuth()
  const { profile, loading, error } = useUserProfile()

  const isGuest = !user
  const isLoading = authLoading || (user && loading)

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin mx-auto" />
          <p className="text-slate-500">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (isGuest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-gray-100">
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-2xl shadow-slate-200 px-10 py-10 flex flex-col items-center gap-5 max-w-sm w-full mx-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0f6f6b] to-[#8EE7E3] flex items-center justify-center shadow-md">
            <Shield size={26} className="text-white" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Your profile awaits</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Log in with Google or your 42 account to unlock your full dashboard — stats, projects, achievements and more.
            </p>
          </div>
          <button
            onClick={mockLogin}
            className="w-full flex items-center justify-center gap-2.5 bg-[#0f6f6b] hover:bg-[#0a5a56] active:scale-[0.98] text-white font-semibold text-sm py-3 px-6 rounded-xl transition-all shadow-md shadow-[#0f6f6b]/30"
          >
            <LogIn size={17} />
            Demo Login
          </button>
          <p className="text-xs text-slate-400 text-center">Use the login page to authenticate with Google or 42 account</p>
        </div>
      </div>
    )
  }

  const initials = user
    ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  const intraSummary = profile?.intraInfo ? extractIntraSummary(profile.intraInfo) : null
  const intraProjects = profile?.intraInfo ? extractProjects(profile.intraInfo) : []
  const intraAchievements = profile?.intraInfo ? extractAchievements(profile.intraInfo) : []
  const intraSkills = profile?.intraInfo ? extractSkills(profile.intraInfo) : []

  const displayedProjects = intraProjects.slice(0, 10)

  const createdDate = new Date(profile?.createdAt || '')
  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })

  return (
    <div className="max-w-6xl mx-auto space-y-5 p-4">
      {error && <ErrorAlert title="Profile Load Error" message={error} />}

      {isLoading ? <LoadingCard /> : (
        // Hero banner
        <Card className="overflow-hidden">
          {/* Cover */}
          <div className="h-32 bg-gradient-to-r from-[#0f6f6b] via-[#1a9e99] to-[#8EE7E3] relative">
            {intraSummary?.campus && (
              <span className="absolute top-3 right-4 text-xs font-semibold bg-white/20 text-white backdrop-blur-sm px-3 py-1 rounded-full border border-white/30">
                {intraSummary.campus.name}
              </span>
            )}
            {/* Avatar anchored to the bottom of the cover */}
            <div className="absolute -bottom-10 left-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white shadow-md">
                {initials}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 pt-14">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-slate-900">{profile?.fullName}</h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0f6f6b] bg-[#8EE7E3]/20 px-2 py-0.5 rounded-full">
                    <Shield size={11} />
                    {profile?.role}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-3">@{profile?.username} {intraSummary && `· ${intraSummary.activeCursus}`}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Mail size={14} />{profile?.email}</span>
                  {intraSummary?.location && <span className="flex items-center gap-1"><MapPin size={14} />{intraSummary.location}</span>}
                  <span className="flex items-center gap-1"><Calendar size={14} />Joined {formatDate(createdDate)}</span>
                </div>
              </div>

              {/* Level / Progress */}
              {intraSummary && (
                <div className="sm:min-w-[180px] space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>Level {intraSummary.level}</span>
                    <span className="text-slate-400">{intraSummary.levelProgress}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#8EE7E3] to-[#0f6f6b]"
                      style={{ width: `${intraSummary.levelProgress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 text-right">{intraSummary.levelProgress} / 100 XP</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* KPI Row */}
      {intraSummary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Correction Points',
              value: intraSummary.correctionPoints,
              icon: CheckCircle2,
              accent: 'text-emerald-500',
              bg: 'bg-emerald-50',
            },
            {
              label: 'Wallet Points',
              value: intraSummary.wallet,
              icon: Zap,
              accent: 'text-amber-500',
              bg: 'bg-amber-50',
            },
            {
              label: 'Projects',
              value: intraSummary.completedProjects,
              icon: TrendingUp,
              accent: 'text-violet-500',
              bg: 'bg-violet-50',
            },
            {
              label: 'Achievements',
              value: intraAchievements.length,
              icon: Star,
              accent: 'text-pink-500',
              bg: 'bg-pink-50',
            },
          ].map((k) => (
            <Card key={k.label} className="p-5 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center flex-shrink-0`}>
                <k.icon size={18} className={k.accent} strokeWidth={2} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 leading-none">{k.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{k.label}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Projects + Achievements */}
      {(displayedProjects.length > 0 || intraAchievements.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {displayedProjects.length > 0 && (
            <Card className="lg:col-span-3 p-6">
              <SectionLabel>Projects ({intraProjects.length})</SectionLabel>
              <div className="space-y-0.5 max-h-96 overflow-y-auto">
                {displayedProjects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-slate-700">{p.name}</span>
                    <ProjectBadge status={p.status} score={p.finalMark} />
                  </div>
                ))}
              </div>
              {intraProjects.length > displayedProjects.length && (
                <p className="text-xs text-slate-400 mt-4 pt-4 border-t">
                  +{intraProjects.length - displayedProjects.length} more projects
                </p>
              )}
            </Card>
          )}

          {intraAchievements.length > 0 && (
            <Card className="lg:col-span-2 p-6">
              <SectionLabel>Achievements ({intraAchievements.length})</SectionLabel>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {intraAchievements.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 text-amber-600">
                      <Star size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{a.name}</p>
                      <p className="text-xs text-slate-400 line-clamp-2">{a.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              {intraAchievements.length > 5 && (
                <p className="text-xs text-slate-400 mt-4 pt-4 border-t">
                  +{intraAchievements.length - 5} more achievements
                </p>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Top Skills */}
      {intraSkills.length > 0 && (
        <Card className="p-6">
          <SectionLabel>Top Skills</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {intraSkills.map((skill) => (
              <div key={skill.id} className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <p className="text-sm font-semibold text-slate-700">{skill.name}</p>
                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#8EE7E3] to-[#0f6f6b]"
                    style={{ width: `${Math.min(skill.level * 20, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">{skill.level}/5</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Connection Info */}
      {intraSummary && (
        <Card className="p-6">
          <SectionLabel>Additional Info</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-400">Status</p>
              <p className="text-sm font-semibold text-slate-900">
                {intraSummary.isAlumni ? 'Alumni' : intraSummary.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            {intraSummary.phone && (
              <div>
                <p className="text-xs text-slate-400">Phone</p>
                <p className="text-sm font-semibold text-slate-900">{intraSummary.phone}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400">Auth Method</p>
              <div className="flex gap-1.5 mt-1">
                {profile?.linkedWithGoogle && (
                  <span className="inline-text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    Google
                  </span>
                )}
                {profile?.linkedWithIntra && (
                  <span className="text-xs bg-slate-50 text-slate-700 px-2 py-0.5 rounded">
                    42
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
