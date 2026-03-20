'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/models/AuthContext'
import Link from 'next/link'

export default function Home() {
  const { user, logout } = useAuth()
  const router = useRouter()

	
  useEffect(() => {
	console.log('RootPage mounted')

	return () => {
		console.log('RootPage unmounted')
	}
	}, [])

  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  useEffect(() => {
	if (user) {
		console.log('User changed:', user.username)
	}
	}, [user])

  
  if (!user) return null

	console.log('👤 Current user:', user)
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 font-sans text-slate-800">
      <h1 className="text-3xl font-semibold">Welcome, {user.fullName} 👋</h1>
      <p className="text-slate-500 text-sm">{user.email}</p>
      <p className="text-xs text-slate-400">Role: {user.role}</p>
      <Link
        href="/home"
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
