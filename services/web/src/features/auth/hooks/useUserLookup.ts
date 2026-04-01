'use client'

import { useCallback, useRef, useState } from 'react'
import { authService, type User } from '@/features/auth/api/authService'

interface UseUserLookupOptions {
  cacheTtlMs?: number
}

interface CachedLookup {
  user: User
  expiresAt: number
}

export function useUserLookup(options?: UseUserLookupOptions) {
  const cacheTtlMs = options?.cacheTtlMs ?? 20_000
  const cacheRef = useRef<Map<number, CachedLookup>>(new Map())

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const readCache = useCallback((userId: number): User | null => {
    const entry = cacheRef.current.get(userId)
    if (!entry) return null
    if (entry.expiresAt < Date.now()) {
      cacheRef.current.delete(userId)
      return null
    }
    return entry.user
  }, [])

  const writeCache = useCallback(
    (nextUser: User) => {
      cacheRef.current.set(nextUser.id, {
        user: nextUser,
        expiresAt: Date.now() + cacheTtlMs,
      })
    },
    [cacheTtlMs],
  )

  const lookup = useCallback(
    async (userId: number, force = false) => {
      if (!force) {
        const cached = readCache(userId)
        if (cached) {
          setUser(cached)
          setError(null)
          return cached
        }
      }

      setLoading(true)
      setError(null)
      try {
        const data = await authService.getUserById(userId, force)
        writeCache(data)
        setUser(data)
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to lookup user'
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [readCache, writeCache],
  )

  const prefetchLookup = useCallback(
    async (userId: number) => {
      const cached = readCache(userId)
      if (cached) return cached
      try {
        const data = await authService.getUserById(userId)
        writeCache(data)
        return data
      } catch {
        return null
      }
    },
    [readCache, writeCache],
  )

  const clear = useCallback(() => {
    setUser(null)
    setError(null)
  }, [])

  return {
    user,
    loading,
    error,
    lookup,
    prefetchLookup,
    clear,
  }
}
