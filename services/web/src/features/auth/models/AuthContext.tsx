'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService, type User } from '@/features/auth/api/authService'

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  error: string | null
  login: (provider: 'google' | '42') => void
  mockLogin: () => void
  handleOAuthCallback: () => Promise<User | null>
  logout: () => Promise<void>
  refresh: () => Promise<boolean>
  clearError: () => void
}

const AuthContext = createContext<AuthState | null>(null)

const mockUser: User = {
  id: 1,
  username: 'jdoe',
  fullName: 'Jane Doe',
  email: 'jane.doe@student.42.fr',
  avatarUrl: null,
  bio: 'Demo account for UI previews.',
  role: 'STUDENT',
  isBanned: false,
  lastSeenAt: null,
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  linkedWithGoogle: false,
  linkedWithIntra: false,
  intraInfo: null,
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── Session Restoration ────────────────────────────────────────────────────
  // On app start, check if user is already authenticated via session cookie
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await authService.refreshAccessToken()
        setUser(response.user)
        setAccessToken(response.accessToken)
        setError(null)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Session restore failed'
        console.warn('Session restore failed:', errorMsg)
        setUser(null)
        setAccessToken(null)
        setError(null)  // Don't show error on initial load failure - just means not logged in
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  const login = (provider: 'google' | '42') => {
    setError(null)
    authService.loginWithProvider(provider)
  }

  const mockLogin = () => {
    setUser(mockUser)
    setAccessToken('mock-token-for-demo')
    setError(null)
  }

  const handleOAuthCallback = async (): Promise<User | null> => {
    try {
      setError(null)
      const userData = await authService.handleOAuthCallback()
      if (userData) {
        setUser(userData)
        setAccessToken(authService.getAccessToken())
      }
      return userData
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'OAuth callback failed'
      setError(errorMsg)
      console.error('OAuth callback error:', errorMsg)
      return null
    }
  }

  const logout = async () => {
    try {
      setError(null)
      await authService.logout()
      setUser(null)
      setAccessToken(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Logout failed'
      console.error('Logout error:', errorMsg)
      setError(errorMsg)
      // Still clear local state even if logout fails
      setUser(null)
      setAccessToken(null)
    }
  }

  const refresh = async (): Promise<boolean> => {
    try {
      setError(null)
      const response = await authService.refreshAccessToken()
      setUser(response.user)
      setAccessToken(response.accessToken)
      return true
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Token refresh failed'
      console.warn('Token refresh failed:', errorMsg)
      setUser(null)
      setAccessToken(null)
      setError(errorMsg)
      return false
    }
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        error,
        login,
        mockLogin,
        handleOAuthCallback,
        logout,
        refresh,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
