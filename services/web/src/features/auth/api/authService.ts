'use client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

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

export interface AuthResponse {
  accessToken: string
  expiresIn: number
  user: User
}

class AuthService {
  private accessToken: string | null = null
  private refreshTimer: ReturnType<typeof setTimeout> | null = null

  loginWithProvider(provider: 'google' | '42') {
    window.location.href = `${API_BASE_URL}/api/public/auth/login/${provider}`
  }

  async handleOAuthCallback(): Promise<User | null> {
    try {
      const response = await this.refreshAccessToken()
      return response.user
    } catch (error) {
      console.error('OAuth callback failed:', error)
      return null
    }
  }

  async refreshAccessToken(): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/public/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const data: AuthResponse = await response.json()
    this.setAccessToken(data.accessToken, data.expiresIn)
    return data
  }

  getAccessToken(): string | null {
    return this.accessToken
  }

  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers)

    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`)
    }

    let response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })

    if (response.status === 401) {
      await this.refreshAccessToken()
      if (this.accessToken) {
        headers.set('Authorization', `Bearer ${this.accessToken}`)
      }
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      })
    }

    return response
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } finally {
      this.accessToken = null
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer)
        this.refreshTimer = null
      }
    }
  }

  private setAccessToken(token: string, expiresIn: number) {
    this.accessToken = token

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    const refreshIn = Math.max(expiresIn - 60, 10) * 1000
    this.refreshTimer = setTimeout(() => {
      this.refreshAccessToken().catch((error) => {
        console.error('Auto-refresh failed:', error)
        this.logout().catch(() => undefined)
      })
    }, refreshIn)
  }
}

export const authService = new AuthService()
