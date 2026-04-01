'use client'

import { useCallback, useState } from 'react'
import { useAuth } from '@/features/auth/models/AuthContext'
import type { SessionInfo } from '@/features/auth/api/authService'

interface UseSessionsOptions {
  initialSessions?: SessionInfo[]
}

export function useSessions(options?: UseSessionsOptions) {
  const { user, listSessions, terminateSession, logoutAll } = useAuth()
  const [sessions, setSessions] = useState<SessionInfo[]>(() => options?.initialSessions ?? [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [endingSessionId, setEndingSessionId] = useState<string | null>(null)
  const [endingAll, setEndingAll] = useState(false)

  const refresh = useCallback(async () => {
    if (!user) {
      setSessions([])
      setError(null)
      return []
    }

    setLoading(true)
    setError(null)
    try {
      const data = await listSessions()
      setSessions(data)
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load sessions'
      setError(message)
      return []
    } finally {
      setLoading(false)
    }
  }, [user, listSessions])

  const endSession = useCallback(
    async (sessionId: string) => {
      setError(null)
      setEndingSessionId(sessionId)
      try {
        const ok = await terminateSession(sessionId)
        if (!ok) {
          setError('Failed to terminate session')
          return false
        }

        try {
          const data = await listSessions()
          setSessions(data)
        } catch (refreshErr) {
          const message = refreshErr instanceof Error ? refreshErr.message : 'Session ended, but refresh failed'
          setError(message)
        }
        return true
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to terminate session'
        setError(message)
        return false
      } finally {
        setEndingSessionId(null)
      }
    },
    [terminateSession, listSessions],
  )

  const endAllSessions = useCallback(async () => {
    setError(null)
    setEndingAll(true)
    try {
      await logoutAll()
      setSessions([])
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to logout all sessions'
      setError(message)
      return false
    } finally {
      setEndingAll(false)
    }
  }, [logoutAll])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    sessions,
    loading,
    error,
    clearError,
    endingSessionId,
    endingAll,
    refresh,
    endSession,
    endAllSessions,
  }
}
