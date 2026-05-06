'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/features/auth/models/AuthContext'

export default function Home() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [isLoading, user, router])

  if (isLoading || !user) return null
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 font-sans text-slate-800">
      <h1 className="text-3xl font-semibold">Welcome, {user.fullName} 👋</h1>
      {user?.overflowEmail && (
        <p className="text-slate-500 text-sm">{user.overflowEmail}</p>
      )}
      {[user?.intraEmail, user?.googleEmail].some(email => email) && (
        <p className="text-slate-400 text-xs">
          {[user?.intraEmail, user?.googleEmail].filter(Boolean).join(", ")}
        </p>
      )}
      <p className="text-xs text-slate-400">Role: {user.role}</p>
      <Link
        href="/projects"
        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-500 transition-colors"
      >
        Go to Forum
      </Link>
      <button
        onClick={async () => {
          await logout()
          router.push('/login')
        }}
        className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 transition-colors"
      >
        Logout
      </button>
	  
    </div>
  )
}
