'use client'

import { useEffect, useState, useCallback } from 'react'
import { authService, type UserSummary } from '@/features/auth/api/authService'

/**
 * Hook to handle user search with debouncing
 */
export function useUserSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)

    // Debounce: wait 300ms after user stops typing
    const timer = setTimeout(() => {
      const performSearch = async () => {
        try {
          const searchResult = await authService.searchUsers(query, 0, 20)
          setResults(searchResult.users)
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Search failed'
          setError(errorMsg)
          console.error('Search error:', errorMsg)
          setResults([])
        } finally {
          setLoading(false)
        }
      }

      performSearch()
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const clear = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
  }, [])

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clear,
    isEmpty: results.length === 0 && !loading,
  }
}
