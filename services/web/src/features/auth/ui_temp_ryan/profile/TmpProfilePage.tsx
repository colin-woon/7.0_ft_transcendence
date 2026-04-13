'use client'

import { motion } from 'motion/react'
import { Calendar, Clock3, Laptop, MapPin, Shield, Smartphone } from 'lucide-react'
import type { SessionInfo, User } from '@/features/auth/api/authService'
import ProfileCard from './ProfileCard2'
import SessionCard from './SessionCard'
import ProfileProjectCard from './ProfileProjectCard'
import PasswordCard from './PasswordCard'
import LinkAccountCard from './LinkAccountCard'
import ProfileSearchCard from './ProfileSearchCard'
import AdminCard from './AdminCard'

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
  role: 'ADMIN',
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
  const isOwnProfile = true; // For demo purposes, we treat this as the user's own profile. Adjust as needed.
  return (
   <motion.div 
     initial={{ filter: 'blur(10px)', opacity: 0 }}
     animate={{ filter: 'blur(0px)', opacity: 1 }}
     transition={{ duration: 0.6, ease: 'easeOut' }}
     className="h-screen bg-gray-50 font-sans mt-16 overflow-y-auto overflow-x-hidden"
   >
        <div className="w-full max-w-6xl flex flex-col gap-5 mx-auto pb-40">

        <motion.div whileHover={{ y: -2, scale: 1.002 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <ProfileCard user={mockUser} profile={profileCardData} initials={initials} isOwnProfile={isOwnProfile}/>
        </motion.div>

        {/* Recent Projects: full width, classic design */}
        <motion.div whileHover={{ y: -2, scale: 1.002 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <ProfileProjectCard projects={mockProjects} />
        </motion.div>

        {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 w-full">
          <ProfileSearchCard isOwnProfile={isOwnProfile} />
          <LinkAccountCard isOwnProfile={isOwnProfile} />
          <PasswordCard isOwnProfile={isOwnProfile} hasPassword={mockUser.hasPassword} />
        </div> */}
        <motion.div whileHover={{ y: -2, scale: 1.002 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <SessionCard sessions={mockSessions} isOwnProfile={isOwnProfile} />
        </motion.div>

        {mockUser.role === 'ADMIN' && (
          <motion.div whileHover={{ y: -2, scale: 1.002 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
            <AdminCard isOwnProfile={isOwnProfile}/>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
