'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/features/auth/models/AuthContext'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refresh } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // After backend OAuth flow, the session should be established via cookies
        // Try to refresh the auth state to verify we're authenticated
        const success = await refresh()

        if (success) {
          // Successfully authenticated, get return_to URL or default to /profile
          const returnTo = searchParams?.get('return_to') || '/profile'
          
          // ⭐ Give auth context a moment to update state before redirect
          // This ensures UI doesn't show unauth state during navigation
          setTimeout(() => {
            router.push(returnTo)
          }, 50)
        } else {
          // Authentication failed
          setError('Authentication failed. Please try logging in again.')
          setTimeout(() => {
            router.push('/login?error=auth_failed')
          }, 2000)
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Callback handling failed'
        console.error('Callback handling failed:', errorMsg)
        setError(errorMsg)
        setTimeout(() => {
          router.push(`/login?error=callback_failed&message=${encodeURIComponent(errorMsg)}`)
        }, 2000)
      }
    }

    handleCallback()
  }, [refresh, router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-gray-100">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Authentication Error</h2>
            <p className="text-sm text-slate-500">{error}</p>
            <p className="text-xs text-slate-400">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Processing your login...</h2>
            <p className="text-sm text-slate-500">Please wait while we complete your authentication.</p>
            <div className="flex justify-center gap-1.5 pt-2">
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-[bounce_0.6s_infinite_0s]" />
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-[bounce_0.6s_infinite_0.2s]" />
              <div className="w-2 h-2 bg-blue-300 rounded-full animate-[bounce_0.6s_infinite_0.4s]" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Loading fallback while useSearchParams is being resolved
function AuthCallbackLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-blue-50 to-gray-100">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Loading...</h2>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<AuthCallbackLoading />}>
      <AuthCallbackContent />
    </Suspense>
  )
}
