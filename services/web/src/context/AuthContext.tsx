'use client'

import React, { createContext, useContext, useState } from 'react'

export interface User {
  id: number
  username: string
  fullName: string
  email: string
  avatarUrl: string | null
  bio: string | null
  role: 'STUDENT' | 'ADMIN'
  isBanned: boolean
  lastSeenAt: string | null
  createdAt: string
  linkedWithGoogle: boolean
  linkedWithIntra: boolean
}

// Mock user for visual demo
const MOCK_USER: User = {
  id: 1,
  username: 'jdoe',
  fullName: 'Jane Doe',
  email: 'jane.doe@student.42.fr',
  avatarUrl: null,
  bio: 'Passionate about code.',
  role: 'STUDENT',
  isBanned: false,
  lastSeenAt: null,
  createdAt: new Date().toISOString(),
  linkedWithGoogle: true,
  linkedWithIntra: false,
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  login: (token: string, user: User) => void
  loginWithToken: (token: string) => Promise<User | null>
  logout: () => Promise<void>
  refresh: () => Promise<boolean>
  mockLogin: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  const mockLogin = () => setUser(MOCK_USER)

  const login = (_token: string, userData: User) => setUser(userData)

  const loginWithToken = async (_token: string): Promise<User | null> => {
    setUser(MOCK_USER)
    return MOCK_USER
  }

  const logout = async () => setUser(null)

  const refresh = async (): Promise<boolean> => false

  return (
    <AuthContext.Provider
      value={{ user, accessToken: null, isLoading: false, login, loginWithToken, logout, refresh, mockLogin }}
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
