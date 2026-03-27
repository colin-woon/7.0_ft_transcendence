'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/features/auth/models/AuthContext'
import { authService, type User } from '@/features/auth/api/authService'

interface UseUserProfileOptions {
  skip?: boolean
}

/**
 * Hook to fetch and manage user profile data
 * Automatically fetches fresh data when user changes or on demand
 */
export function useUserProfile(userId?: number, options?: UseUserProfileOptions) {
  const { user: authUser, accessToken } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const targetUserId = userId || authUser?.id
  const skip = options?.skip || !targetUserId || !accessToken

  // Fetch profile data
  useEffect(() => {
    if (skip) {
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchProfile = async () => {
      try {
        setLoading(true)
        setError(null)

        const data = userId && userId !== authUser?.id
          ? await authService.getUserById(userId)
          : await authService.getCurrentUserProfile()

        if (isMounted) {
          setProfile(data)
        }
      } catch (err) {
        if (isMounted) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to load profile'
          setError(errorMsg)
          console.error('Profile fetch error:', errorMsg)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchProfile()

    return () => {
      isMounted = false
    }
  }, [targetUserId, userId, authUser, accessToken, skip])

  // Refetch profile on demand
  const refetch = async () => {
    if (skip) return
    try {
      setLoading(true)
      setError(null)

      const data = userId && userId !== authUser?.id
        ? await authService.getUserById(userId)
        : await authService.getCurrentUserProfile()

      setProfile(data)
      return data
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to reload profile'
      setError(errorMsg)
      console.error('Profile refetch error:', errorMsg)
      return null
    } finally {
      setLoading(false)
    }
  }

  return {
    profile,
    loading,
    error,
    refetch,
    isEmpty: !profile,
  }
}
