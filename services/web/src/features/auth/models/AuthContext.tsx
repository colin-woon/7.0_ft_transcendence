'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authService, type User } from '@/features/auth/api/authService'

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  login: (provider: 'google' | '42') => void
  mockLogin: () => void
  handleOAuthCallback: () => Promise<User | null>
  logout: () => Promise<void>
  refresh: () => Promise<boolean>
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
  createdAt: new Date().toISOString(),
  linkedWithGoogle: false,
  linkedWithIntra: false,
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await authService.refreshAccessToken()
        setUser(response.user)
        setAccessToken(response.accessToken)
      } catch {
        setUser(null)
        setAccessToken(null)
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  const login = (provider: 'google' | '42') => {
    authService.loginWithProvider(provider)
  }

  const mockLogin = () => {
    setUser(mockUser)
    setAccessToken('mock-token')
  }

  const handleOAuthCallback = async (): Promise<User | null> => {
    const userData = await authService.handleOAuthCallback()
    if (userData) {
      setUser(userData)
      setAccessToken(authService.getAccessToken())
    }
    return userData
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
    setAccessToken(null)
  }

  const refresh = async (): Promise<boolean> => {
    try {
      const response = await authService.refreshAccessToken()
      setUser(response.user)
      setAccessToken(response.accessToken)
      return true
    } catch {
      setUser(null)
      setAccessToken(null)
      return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        mockLogin,
        handleOAuthCallback,
        logout,
        refresh,
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
