'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/models/AuthContext'

export default function AuthCallback() {
  const router = useRouter()
  const { handleOAuthCallback } = useAuth()

  useEffect(() => {
    const finalize = async () => {
      const user = await handleOAuthCallback()
      if (user) {
        router.push('/profile')
        return
      }
      router.push('/login?error=oauth_failed')
    }

    finalize()
  }, [handleOAuthCallback, router])

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-500">
      Processing authentication...
    </div>
  )
}
