'use client'

import { useCallback, useState } from 'react'
import { useAuth } from '@/features/auth/models/AuthContext'
import type { User, UserUpdatePayload } from '@/features/auth/api/authService'

export function useProfileEdit() {
  const { updateProfile, deleteAccount } = useAuth()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveProfile = useCallback(
    async (payload: UserUpdatePayload): Promise<User | null> => {
      setSaving(true)
      setError(null)
      try {
        return await updateProfile(payload)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update profile'
        setError(message)
        return null
      } finally {
        setSaving(false)
      }
    },
    [updateProfile],
  )

  const deleteProfile = useCallback(async (): Promise<boolean> => {
    setDeleting(true)
    setError(null)
    try {
      await deleteAccount()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete profile'
      setError(message)
      return false
    } finally {
      setDeleting(false)
    }
  }, [deleteAccount])

  return {
    saving,
    deleting,
    error,
    saveProfile,
    deleteProfile,
  }
}
