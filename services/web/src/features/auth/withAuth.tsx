'use client'

import { useAuth } from '@/features/auth/models/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface WithAuthOptions {
  requiredRole?: 'ADMIN' | 'STUDENT'
  redirectTo?: string
}

/**
 * HOC to protect pages from unauthenticated access
 * Redirects to login if user is not authenticated
 *
 * @example
 * const ProtectedPage = withAuth(MyPage)
 * const AdminPage = withAuth(AdminPanel, { requiredRole: 'ADMIN' })
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: WithAuthOptions,
) {
  const requiredRole = options?.requiredRole
  const redirectTo = options?.redirectTo || '/login'

  return function ProtectedComponent(props: P) {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (isLoading) return

      if (!user) {
        // Not authenticated - redirect to login with return_to URL
        const returnTo = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'
        router.push(`${redirectTo}?return_to=${encodeURIComponent(returnTo)}`)
        return
      }

      if (requiredRole && user.role !== requiredRole) {
        // Not the required role - redirect to access denied
        router.push('/access-denied')
      }
    }, [user, isLoading, router])

    // Show loading while checking auth
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-500 animate-spin mx-auto" />
            <p className="text-slate-500">Checking authentication...</p>
          </div>
        </div>
      )
    }

    // Not authenticated
    if (!user) {
      return null  // Will redirect via useEffect
    }

    // Wrong role
    if (requiredRole && user.role !== requiredRole) {
      return null  // Will redirect via useEffect
    }

    // Authenticated and authorized - render component
    return <Component {...props} />
  }
}
