'use client'

import { Calendar, Clock3, Laptop, MapPin, Shield, Smartphone } from 'lucide-react'
import type { SessionInfo, User } from '@/features/auth/api/authService'
import ProfileCard from './ProfileCard'
import SessionCard from './SessionCard'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
}

const mockUser: User = {
  id: 999,
  hasPassword: false,
  username: 'tmp_user',
  fullName: 'Temp Profile User',
  email: 'tmp_user@42.fr',
  avatarUrl: null,
  bio: 'c code gooner | 42 student',
  role: 'STUDENT',
  isBanned: false,
  lastSeenAt: '2026-04-06T15:20:00.000Z',
  createdAt: '2024-09-01T08:00:00.000Z',
  linkedWithGoogle: true,
  linkedWithIntra: true,
  updatedAt: '2026-04-06T15:20:00.000Z',
  intraInfo: null,
}

const mockSessions: SessionInfo[] = [
  {
    sessionId: 'sess-current-web',
    isCurrent: true,
    deviceType: 'Desktop',
    browser: 'Chrome',
    os: 'Linux',
    ipAddress: '192.168.0.12',
    createdAt: '2026-04-04T10:12:00.000Z',
    expiresAt: '2026-04-14T10:12:00.000Z',
  },
  {
    sessionId: 'sess-iphone',
    isCurrent: false,
    deviceType: 'Mobile',
    browser: 'Safari',
    os: 'iOS',
    ipAddress: '10.0.0.52',
    createdAt: '2026-04-01T18:30:00.000Z',
    expiresAt: '2026-04-11T18:30:00.000Z',
  },
  {
    sessionId: 'sess-macbook',
    isCurrent: false,
    deviceType: 'Desktop',
    browser: 'Firefox',
    os: 'macOS',
    ipAddress: '172.20.10.4',
    createdAt: '2026-03-28T08:50:00.000Z',
    expiresAt: '2026-04-07T08:50:00.000Z',
  },
]

const mockProjects = [
  { name: 'Libft', status: 'completed', score: 125 },
  { name: 'ft_printf', status: 'completed', score: 100 },
  { name: 'minishell', status: 'in_progress', score: null },
  { name: 'cub3d', status: 'pending', score: null },
]

const profileCardData = {
  level: 6,
  levelProgress: 72,
  cursus: '42 Common Core',
  coalition: 'North Cluster',
  email: mockUser.email,
  location: 'Paris Campus',
  since: 'Sep 2024',
}

const initials = mockUser.fullName
  .split(' ')
  .map((name) => name[0])
  .join('')
  .slice(0, 2)
  .toUpperCase()

function formatDate(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TmpProfilePage() {
  return (
   <div className="h-screen bg-gray-50 font-sans mt-16 overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-6xl flex flex-col gap-5 mx-auto pb-200">
        {/* <Card className="p-4 sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Frontend Sandbox</p>
          <h1 className="mt-1 text-xl font-bold text-slate-900">Temporary Profile Page</h1>
          <p className="mt-1 text-sm text-slate-500">
            Everything here is hardcoded so you can focus on styling and layout without auth/session API calls.
          </p>
        </Card> */}

        <ProfileCard user={mockUser} profile={profileCardData} initials={initials} isOwnProfile={false}/>


        {/* Recent Projects: full width, classic design */}
        <div className="w-full">
          <Card className="p-5 w-full">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Recent Projects</p>
            <div className="space-y-2">
              {mockProjects.map((project) => (
                <div
                  key={project.name}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <p className="text-sm font-medium text-slate-800">{project.name}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-full bg-white px-2 py-1 text-slate-500 border border-slate-200">
                      {project.status}
                    </span>
                    <span className="rounded-full bg-[#8EE7E3]/20 px-2 py-1 text-[#0f6f6b] border border-[#8EE7E3]/40">
                      {project.score !== null ? `${project.score}%` : '--'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <SessionCard sessions={mockSessions} isOwnProfile={false} />
      </div>
    </div>
  )
}
