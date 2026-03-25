'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/models/AuthContext'

export const dynamic = 'force-dynamic'

export default function AuthCallback() {
  const router = useRouter()
  const { refresh } = useAuth()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // After backend OAuth flow, the session should be established via cookies
        // Try to refresh the auth state to verify we're authenticated
        const success = await refresh()

        if (success) {
          // Successfully authenticated, redirect to profile
          router.push('/profile')
        } else {
          // Authentication failed
          router.push('/login?error=auth_failed')
        }
      } catch (err) {
        console.error('Callback handling failed:', err)
        router.push('/login?error=callback_failed')
      }
    }

    handleCallback()
  }, [refresh, router])

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Processing your login...</h2>
        <p className="text-sm">Please wait while we complete your authentication.</p>
      </div>
    </div>
  )
}
