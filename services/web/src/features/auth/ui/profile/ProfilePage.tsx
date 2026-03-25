'use client'

import { useAuth } from '@/features/auth/models/AuthContext'
import {
  CheckCircle2, Clock, Coins, Loader2,
  Monitor, Star, TrendingUp, Mail,
  MapPin, Calendar, Shield, LogIn,
} from 'lucide-react'
import ProfileCard from './ProfileCard'

// ── Mock data ──────────────────────────────────────────────────────────────────

const profile = {
  level: 8,
  levelProgress: 58,
  cursus: '42cursus · Cadet',
  coalition: 'Freax',
  coalitionPoints: 140,
  evaluationPoints: 6,
  walletPoints: 140,
  hoursThisWeek: 42,
  email: 'jane.doe@student.42.fr',
  location: 'Kuala Lumpur',
  since: 'Jan 2025',
}

const milestones = [
  { id: 1, done: false },
  { id: 2, done: true },
  { id: 3, done: true },
  { id: 4, done: true },
  { id: 5, done: true },
  { id: 6, done: false },
]

type ProjectStatus = 'completed' | 'in-progress' | 'failed'
const projects: { id: number; name: string; status: ProjectStatus; score?: number }[] = [
  { id: 1, name: 'ft_transcendence', status: 'completed', score: 100 },
  { id: 2, name: 'ft_irc',           status: 'completed', score: 125 },
  { id: 3, name: 'webserv',          status: 'completed', score: 110 },
  { id: 4, name: 'minishell',        status: 'completed', score: 101 },
  { id: 5, name: 'Python - 3 - OOP', status: 'in-progress' },
  { id: 6, name: 'Python - 4 - DoD', status: 'in-progress' },
]

const achievements = [
  { id: 1, name: 'Code Explorer',   desc: 'Validated 21 projects.',          icon: Monitor,    bg: 'bg-violet-50', ring: 'ring-violet-200', text: 'text-violet-600'  },
  { id: 2, name: 'Bonus Hunter',    desc: '10 projects with maximum score.', icon: Star,       bg: 'bg-amber-50',  ring: 'ring-amber-200',  text: 'text-amber-500'   },
  { id: 3, name: "Rich Man's World",desc: 'Collected 100 wallet points.',    icon: Coins,      bg: 'bg-yellow-50', ring: 'ring-yellow-200', text: 'text-yellow-600'  },
  { id: 4, name: 'On a Roll',       desc: 'Logged in 7 days straight.',      icon: TrendingUp, bg: 'bg-emerald-50',ring: 'ring-emerald-200',text: 'text-emerald-600' },
]

// 16 weeks x 7 days logtime intensities (0-3)
const logtimeGrid = Array.from({ length: 16 }, (_, w) =>
  Array.from({ length: 7 }, (_, d) => {
    const v = (w * 7 + d * 3 + w + 5) % 13
    if (v < 3) return 0
    if (v < 7) return 1
    if (v < 11) return 2
    return 3
  })
)
const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// ── Sub-components ─────────────────────────────────────────────────────────────

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

function ProjectBadge({ status, score }: { status: ProjectStatus; score?: number }) {
  if (status === 'completed')
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
        <CheckCircle2 size={10} strokeWidth={2.5} />
        {score !== undefined ? `${score}%` : 'Done'}
      </span>
    )
  if (status === 'in-progress')
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
        <Loader2 size={10} className="animate-spin" strokeWidth={2.5} />
        In progress
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
      Failed
    </span>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, mockLogin } = useAuth()
  const isGuest = !user

  const initials = user
    ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'JD'

  const completedCount = projects.filter((p) => p.status === 'completed').length

  return (
    <div className="relative">

      {/* Profile content — blurred for guests */}
      <div className={`max-w-6xl mx-auto space-y-5 transition-all duration-300 ${isGuest ? 'blur-sm pointer-events-none select-none' : ''}`}>

      {/* Hero banner */}
      <ProfileCard user={user} profile={profile} initials={initials} />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Evaluation Points', value: profile.evaluationPoints, icon: CheckCircle2, accent: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Wallet Points',      value: profile.walletPoints,     icon: Coins,        accent: 'text-amber-500',   bg: 'bg-amber-50'   },
          { label: 'Hours This Week',    value: profile.hoursThisWeek,    icon: Clock,        accent: 'text-blue-500',    bg: 'bg-blue-50'    },
          { label: 'Projects Done',      value: completedCount,           icon: TrendingUp,   accent: 'text-violet-500',  bg: 'bg-violet-50'  },
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

      {/* Milestone track */}
      <Card className="px-6 py-5">
        <SectionLabel>Milestone Progress</SectionLabel>
        <div className="flex items-center">
          {milestones.map((m, i) => (
            <div key={m.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  m.done
                    ? 'bg-[#0f6f6b] border-[#0f6f6b] text-white shadow-sm shadow-[#0f6f6b]/30'
                    : i === milestones.findIndex(x => !x.done)
                      ? 'bg-white border-[#0f6f6b] text-[#0f6f6b]'
                      : 'bg-white border-gray-200 text-gray-300'
                }`}>
                  {m.done ? <CheckCircle2 size={16} strokeWidth={2.5} /> : m.id}
                </div>
                <span className="text-[10px] text-slate-400">M{m.id}</span>
              </div>
              {i < milestones.length - 1 && (
                <div className={`flex-1 h-0.5 mb-4 mx-1 ${
                  milestones[i + 1].done || m.done ? 'bg-[#0f6f6b]' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Projects + Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <Card className="lg:col-span-3 p-6">
          <SectionLabel>Projects</SectionLabel>
          <div className="space-y-0.5">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <span className="text-sm font-medium text-slate-700">{p.name}</span>
                <ProjectBadge status={p.status} score={p.score} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <SectionLabel>Achievements</SectionLabel>
          <div className="space-y-3">
            {achievements.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${a.bg} ring-1 ${a.ring} flex items-center justify-center flex-shrink-0`}>
                  <a.icon size={17} className={a.text} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{a.name}</p>
                  <p className="text-xs text-slate-400 truncate">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Logtime heatmap */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>Logtime · Last 16 weeks</SectionLabel>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">Less</span>
            {['bg-gray-100', 'bg-[#8EE7E3]/30', 'bg-[#8EE7E3]/70', 'bg-[#0f6f6b]'].map((c, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
            ))}
            <span className="text-[10px] text-slate-400">More</span>
          </div>
        </div>
        <div className="flex gap-0.5 overflow-x-auto pb-1">
          <div className="flex flex-col gap-0.5 mr-1.5">
            {days.map((d, i) => (
              <div key={i} className="w-3.5 h-3.5 flex items-center justify-center text-[8px] text-slate-300">
                {i % 2 === 0 ? d : ''}
              </div>
            ))}
          </div>
          {logtimeGrid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((v, di) => (
                <div
                  key={di}
                  className={`w-3.5 h-3.5 rounded-sm hover:opacity-80 transition-opacity ${
                    v === 0 ? 'bg-gray-100'
                    : v === 1 ? 'bg-[#8EE7E3]/30'
                    : v === 2 ? 'bg-[#8EE7E3]/70'
                    : 'bg-[#0f6f6b]'
                  }`}
                  title={`Week ${wi + 1} · ${days[di]}`}
                />
              ))}
            </div>
          ))}
        </div>
      </Card>

      </div>{/* end blurred profile content */}

      {/* Guest overlay */}
      {isGuest && (
        <div className="absolute inset-0 z-10 flex items-start justify-center pt-40">
          <div className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-2xl shadow-slate-200 px-10 py-10 flex flex-col items-center gap-5 max-w-sm w-full mx-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0f6f6b] to-[#8EE7E3] flex items-center justify-center shadow-md">
              <Shield size={26} className="text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Your profile awaits</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Log in with your 42 account to unlock your full dashboard — stats, projects, achievements and more.
              </p>
            </div>
            <button
              onClick={mockLogin}
              className="w-full flex items-center justify-center gap-2.5 bg-[#0f6f6b] hover:bg-[#0a5a56] active:scale-[0.98] text-white font-semibold text-sm py-3 px-6 rounded-xl transition-all shadow-md shadow-[#0f6f6b]/30"
            >
              <LogIn size={17} />
              Log in with 42
            </button>
            <p className="text-[11px] text-slate-400">You&apos;ll be redirected to the 42 OAuth flow</p>
          </div>
        </div>
      )}

    </div>
  )
}
