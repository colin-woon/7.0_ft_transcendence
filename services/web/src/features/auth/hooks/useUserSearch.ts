"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { UserSummary } from "@/features/auth/api/authService";
import { authService } from "@/features/auth/api/authService";

interface UseUserSearchOptions {
  debounceMs?: number;
  minChars?: number;
  pageSize?: number;
  excludeUserId?: number;
}

export function useUserSearch(options?: UseUserSearchOptions) {
  const debounceMs = options?.debounceMs ?? 300;
  const minChars = options?.minChars ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const excludeUserId = options?.excludeUserId;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const requestId = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(
    async (term: string, pageValue = 0) => {
      const trimmed = term.trim();
      if (trimmed.length < minChars) {
        requestId.current += 1;
        setResults([]);
        setHasMore(false);
        setError(null);
        setLoading(false);
        return;
      }

      const nextRequestId = ++requestId.current;
      setLoading(true);
      setError(null);

      try {
        const requestedSize =
          pageSize + (typeof excludeUserId === "number" ? 1 : 0);
        const users = await authService.searchUsers(
          trimmed,
          pageValue,
          requestedSize,
        );
        if (nextRequestId === requestId.current) {
          const filteredUsers =
            typeof excludeUserId === "number"
              ? users.filter((entry) => entry.id !== excludeUserId)
              : users;
          setResults(filteredUsers.slice(0, pageSize));
          setHasMore(users.length === requestedSize);
        }
      } catch (err) {
        if (nextRequestId === requestId.current) {
          const message = err instanceof Error ? err.message : "Search failed";
          setError(message);
          setResults([]);
          setHasMore(false);
        }
      } finally {
        if (nextRequestId === requestId.current) {
          setLoading(false);
        }
      }
    },
    [excludeUserId, minChars, pageSize],
  );

  useEffect(() => {
    debounceTimerRef.current = setTimeout(() => {
      runSearch(query, page);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [query, page, runSearch, debounceMs]);

  const clear = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    requestId.current += 1;
    setQuery("");
    setResults([]);
    setHasMore(false);
    setError(null);
    setPage(0);
    setLoading(false);
  }, []);

  const searchNow = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    await runSearch(query, page);
  }, [runSearch, query, page]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearError,
    page,
    hasMore,
    setPage,
    clear,
    searchNow,
    isEmpty: !loading && results.length === 0,
  };
}
