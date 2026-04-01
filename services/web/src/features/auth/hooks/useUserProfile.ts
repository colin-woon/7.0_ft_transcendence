'use client'

import { useCallback, useEffect, useState } from 'react'
import { AuthApiError, authService, type User, type UserUpdatePayload } from '@/features/auth/api/authService'
import { useAuth } from '@/features/auth/models/AuthContext'

interface UseUserProfileOptions {
  skip?: boolean
  forceFresh?: boolean
}

export function useUserProfile(userId?: number, options?: UseUserProfileOptions) {
  const { user: authUser, accessToken, updateProfile: updateMyProfile } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorStatus, setErrorStatus] = useState<number | null>(null)

  const targetUserId = userId ?? authUser?.id
  const skip = options?.skip || !targetUserId || !accessToken

  const fetchProfile = useCallback(
    async (force = false) => {
      if (skip || !targetUserId) {
        setLoading(false)
        return null
      }

      setLoading(true)
      setError(null)
      setErrorStatus(null)

      try {
        const data =
          userId && authUser?.id !== userId
            ? await authService.getUserById(userId, force || options?.forceFresh)
            : await authService.getCurrentUserProfile(force || options?.forceFresh)

        setProfile(data)
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load profile'
        setError(message)
        setErrorStatus(err instanceof AuthApiError ? err.status : null)
        return null
      } finally {
        setLoading(false)
      }
    },
    [skip, targetUserId, userId, authUser?.id, options?.forceFresh],
  )

  useEffect(() => {
    fetchProfile(false)
  }, [fetchProfile])

  const refetch = useCallback(async () => fetchProfile(true), [fetchProfile])

  const updateProfile = useCallback(
    async (payload: UserUpdatePayload) => {
      setError(null)
      setErrorStatus(null)
      setLoading(true)
      try {
        if (userId && authUser?.id !== userId) {
          throw new Error('Only your own profile can be updated from this page')
        }

        const updated = await updateMyProfile(payload)
        setProfile(updated)
        return updated
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update profile'
        setError(message)
        setErrorStatus(err instanceof AuthApiError ? err.status : null)
        return null
      } finally {
        setLoading(false)
      }
    },
    [updateMyProfile, userId, authUser?.id],
  )

  return {
    profile,
    loading,
    error,
    errorStatus,
    refetch,
    updateProfile,
    isEmpty: !profile,
  }
}
