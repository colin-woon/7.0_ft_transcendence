'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AuthApiError, authService, type User, type UserUpdatePayload } from '@/features/auth/api/authService'
import { useAuth } from '@/features/auth/models/AuthContext'

interface UseUserProfileOptions {
  skip?: boolean
  forceFresh?: boolean
  initialProfile?: User | null
  initialError?: string | null
  initialErrorStatus?: number | null
}

export function useUserProfile(userId?: number, options?: UseUserProfileOptions) {
  const { user: authUser, accessToken, updateProfile: updateMyProfile } = useAuth()
  const requestIdRef = useRef(0)
  const hasInitialState =
    options !== undefined &&
    ('initialProfile' in options || 'initialError' in options || 'initialErrorStatus' in options)
  const skipInitialFetchRef = useRef(hasInitialState)

  const [profile, setProfile] = useState<User | null>(options?.initialProfile ?? null)
  const [loading, setLoading] = useState(!hasInitialState)
  const [error, setError] = useState<string | null>(options?.initialError ?? null)
  const [errorStatus, setErrorStatus] = useState<number | null>(options?.initialErrorStatus ?? null)

  const targetUserId = userId ?? authUser?.id
  const skip = options?.skip || !targetUserId || !accessToken

  const fetchProfile = useCallback(
    async (force = false) => {
      const requestId = ++requestIdRef.current
      if (skip || !targetUserId) {
        if (requestId === requestIdRef.current) {
          setProfile(null)
          setError(null)
          setErrorStatus(null)
          setLoading(false)
        }
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

        if (requestId === requestIdRef.current) {
          setProfile(data)
        }
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load profile'
        if (requestId === requestIdRef.current) {
          setError(message)
          setErrorStatus(err instanceof AuthApiError ? err.status : null)
        }
        return null
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    },
    [skip, targetUserId, userId, authUser?.id, options?.forceFresh],
  )

  useEffect(() => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false
      return () => {
        requestIdRef.current += 1
      }
    }

    fetchProfile(false)
    return () => {
      requestIdRef.current += 1
    }
  }, [fetchProfile])

  const refetch = useCallback(async () => fetchProfile(true), [fetchProfile])

  const updateProfile = useCallback(
    async (payload: UserUpdatePayload) => {
      const requestId = ++requestIdRef.current
      setError(null)
      setErrorStatus(null)
      setLoading(true)
      try {
        if (userId && authUser?.id !== userId) {
          throw new Error('Only your own profile can be updated from this page')
        }

        const updated = await updateMyProfile(payload)
        if (requestId === requestIdRef.current) {
          setProfile(updated)
        }
        return updated
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update profile'
        if (requestId === requestIdRef.current) {
          setError(message)
          setErrorStatus(err instanceof AuthApiError ? err.status : null)
        }
        return null
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    },
    [updateMyProfile, userId, authUser?.id],
  )

  const clearError = useCallback(() => {
    setError(null)
    setErrorStatus(null)
  }, [])

  return {
    profile,
    loading,
    error,
    errorStatus,
    clearError,
    refetch,
    updateProfile,
    isEmpty: !profile,
  }
}
