'use client'

import { useCallback, useState } from 'react'
import { useAuth } from '@/features/auth/models/AuthContext'

export function useAuthActions() {
  const { login, link, logout, refresh, clearError } = useAuth()
  const [actionLoading, setActionLoading] = useState<null | 'logout' | 'refresh'>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const loginWith = useCallback(
    (provider: 'google' | '42') => {
      clearError()
      setActionError(null)
      login(provider)
    },
    [clearError, login],
  )

  const linkWith = useCallback(
    (provider: 'google' | '42') => {
      clearError()
      setActionError(null)
      link(provider)
    },
    [clearError, link],
  )

  const logoutNow = useCallback(async () => {
    setActionLoading('logout')
    setActionError(null)
    try {
      await logout()
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Logout failed'
      setActionError(message)
      return false
    } finally {
      setActionLoading(null)
    }
  }, [logout])

  const refreshNow = useCallback(async () => {
    setActionLoading('refresh')
    setActionError(null)
    try {
      const ok = await refresh()
      if (!ok) {
        setActionError('Refresh failed')
      }
      return ok
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Refresh failed'
      setActionError(message)
      return false
    } finally {
      setActionLoading(null)
    }
  }, [refresh])

  const clearActionError = useCallback(() => {
    setActionError(null)
  }, [])

  return {
    actionLoading,
    actionError,
    clearActionError,
    loginWith,
    linkWith,
    logoutNow,
    refreshNow,
  }
}
