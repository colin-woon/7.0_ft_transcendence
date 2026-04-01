'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { UserSummary } from '@/features/auth/api/authService'
import { authService } from '@/features/auth/api/authService'

interface UseUserSearchOptions {
  debounceMs?: number
  minChars?: number
  pageSize?: number
}

export function useUserSearch(options?: UseUserSearchOptions) {
  const debounceMs = options?.debounceMs ?? 300
  const minChars = options?.minChars ?? 1
  const pageSize = options?.pageSize ?? 20

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const requestId = useRef(0)

  const runSearch = useCallback(
    async (term: string, pageValue = 0) => {
      const trimmed = term.trim()
      if (trimmed.length < minChars) {
        setResults([])
        setError(null)
        setLoading(false)
        return
      }

      const nextRequestId = ++requestId.current
      setLoading(true)
      setError(null)

      try {
        const users = await authService.searchUsers(trimmed, pageValue, pageSize)
        if (nextRequestId === requestId.current) {
          setResults(users)
        }
      } catch (err) {
        if (nextRequestId === requestId.current) {
          const message = err instanceof Error ? err.message : 'Search failed'
          setError(message)
          setResults([])
        }
      } finally {
        if (nextRequestId === requestId.current) {
          setLoading(false)
        }
      }
    },
    [minChars, pageSize],
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      runSearch(query, page)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [query, page, runSearch, debounceMs])

  const clear = useCallback(() => {
    requestId.current += 1
    setQuery('')
    setResults([])
    setError(null)
    setPage(0)
    setLoading(false)
  }, [])

  const searchNow = useCallback(async () => runSearch(query, page), [runSearch, query, page])

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    page,
    setPage,
    clear,
    searchNow,
    isEmpty: !loading && results.length === 0,
  }
}
