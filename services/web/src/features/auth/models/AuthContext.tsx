'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  authService,
  type AdminUpdatePayload,
  type CreateUserPayload,
  type SessionInfo,
  type User,
  type UserSummary,
  type UserUpdatePayload,
} from '@/features/auth/api/authService'

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  login: (provider: 'google' | '42') => void
  handleOAuthCallback: () => Promise<User | null>
  logout: () => Promise<void>
  terminateSession: (sessionId: string) => Promise<boolean>
  logoutAll: () => Promise<void>
  refresh: () => Promise<boolean>
  clearError: () => void
  hasRole: (role: User['role']) => boolean
  updateProfile: (payload: UserUpdatePayload) => Promise<User>
  deleteAccount: () => Promise<void>
  reloadIntraData: () => Promise<User | null>
  listSessions: () => Promise<SessionInfo[]>
  searchUsers: (query: string, page?: number, size?: number) => Promise<UserSummary[]>
  adminUpdateUser: (userId: number, payload: AdminUpdatePayload) => Promise<User>
  adminLogoutUser: (userId: number) => Promise<void>
  adminCreateUser: (payload: CreateUserPayload) => Promise<User>
  adminDeleteUser: (userId: number) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const updateAuthState = (nextUser: User | null, token: string | null) => {
    setUser(nextUser)
    setAccessToken(token)
  }

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await authService.refreshAccessToken()
        updateAuthState(response.user, response.accessToken)
        setError(null)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to restore session'
        updateAuthState(null, null)
        setError(msg)
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

  const handleOAuthCallback = async (): Promise<User | null> => {
    try {
      const userData = await authService.handleOAuthCallback()
      if (userData) {
        updateAuthState(userData, authService.getAccessToken())
        setError(null)
      }
      return userData
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'OAuth callback failed'
      setError(msg)
      return null
    }
  }

  const logout = async () => {
    try {
      await authService.logout()
      setError(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Logout failed'
      setError(msg)
      throw err
    } finally {
      updateAuthState(null, null)
    }
  }

  const terminateSession = async (sessionId: string): Promise<boolean> => {
    try {
      await authService.logoutSession(sessionId)
      setError(null)
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to terminate session'
      setError(msg)
      return false
    }
  }

  const logoutAll = async () => {
    try {
      await authService.logoutAll()
      setError(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to logout all sessions'
      setError(msg)
      throw err
    } finally {
      updateAuthState(null, null)
    }
  }

  const refresh = async (): Promise<boolean> => {
    try {
      const response = await authService.refreshAccessToken()
      updateAuthState(response.user, response.accessToken)
      setError(null)
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Refresh failed'
      updateAuthState(null, null)
      setError(msg)
      return false
    }
  }

  const updateProfile = async (payload: UserUpdatePayload): Promise<User> => {
    const updated = await authService.updateCurrentUserProfile(payload)
    setUser(updated)
    return updated
  }

  const deleteAccount = async (): Promise<void> => {
    try {
      await authService.deleteCurrentUser()
      setError(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete account'
      setError(msg)
      throw err
    } finally {
      updateAuthState(null, null)
    }
  }

  const reloadIntraData = async (): Promise<User | null> => {
    if (!user) return null
    try {
      const updated = await authService.reloadIntraData(user.id)
      setUser(updated)
      setError(null)
      return updated
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to reload 42 data'
      setError(msg)
      return null
    }
  }

  const listSessions = async (): Promise<SessionInfo[]> => {
    try {
      return await authService.listSessions()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch sessions'
      setError(msg)
      throw err
    }
  }

  const searchUsers = async (query: string, page = 0, size = 20): Promise<UserSummary[]> => {
    try {
      return await authService.searchUsers(query, page, size)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Search failed'
      setError(msg)
      throw err
    }
  }

  const adminUpdateUser = async (userId: number, payload: AdminUpdatePayload): Promise<User> => {
    return authService.adminUpdateUser(userId, payload)
  }

  const adminLogoutUser = async (userId: number): Promise<void> => {
    await authService.adminLogoutUser(userId)
  }

  const adminCreateUser = async (payload: CreateUserPayload): Promise<User> => {
    return authService.adminCreateUser(payload)
  }

  const adminDeleteUser = async (userId: number): Promise<void> => {
    await authService.adminDeleteUser(userId)
  }

  const clearError = () => {
    setError(null)
  }

  const hasRole = (role: User['role']) => user?.role === role

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated: !!user && !!accessToken,
        error,
        login,
        handleOAuthCallback,
        logout,
        terminateSession,
        logoutAll,
        refresh,
        clearError,
        hasRole,
        updateProfile,
        deleteAccount,
        reloadIntraData,
        listSessions,
        searchUsers,
        adminUpdateUser,
        adminLogoutUser,
        adminCreateUser,
        adminDeleteUser,
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
