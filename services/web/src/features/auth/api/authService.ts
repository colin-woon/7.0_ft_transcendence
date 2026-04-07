'use client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

function getApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!API_BASE_URL) {
    return normalizedPath
  }
  return `${API_BASE_URL}${normalizedPath}`
}

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
  hasPassword: boolean
  updatedAt?: string
  intraInfo?: IntraInfo | null
}

export interface IntraImage {
  link: string
  versions: {
    large: string
    medium: string
    small: string
  }
}

export interface IntraInfo {
  url: string | null
  phone: string | null
  kind: string | null
  image: IntraImage | null
  correctionPoints: number
  poolMonth: string | null
  poolYear: string | null
  location: string | null
  wallet: number
  isAlumni: boolean
  isActive: boolean
  groups: Record<string, unknown>[]
  cursusUsers: Record<string, unknown>[]
  projectsUsers: Record<string, unknown>[]
  languagesUsers: Record<string, unknown>[]
  achievements: Record<string, unknown>[]
  titles: Record<string, unknown>[]
  titlesUsers: Record<string, unknown>[]
  partnerships: Record<string, unknown>[]
  patroned: Record<string, unknown>[]
  patroning: Record<string, unknown>[]
  expertisesUsers: Record<string, unknown>[]
  roles: Record<string, unknown>[]
  campus: Record<string, unknown>[]
  campusUsers: Record<string, unknown>[]
}

export interface AuthResponse {
  accessToken: string
  expiresIn: string | number | Date
  user: User
}

export interface UserSummary {
  id: number
  username: string
  fullName: string
  avatarUrl: string | null
}

export interface SessionInfo {
  sessionId: string
  isCurrent: boolean
  deviceType: string | null
  browser: string | null
  os: string | null
  ipAddress: string | null
  expiresAt: string
  createdAt: string
}

export interface UserUpdatePayload {
  username?: string
  fullName?: string
  avatarUrl?: string
  bio?: string
}

export interface AdminUpdatePayload extends UserUpdatePayload {
  role?: 'STUDENT' | 'ADMIN'
  isBanned?: boolean
}

export interface CreateUserPayload {
  username: string
  fullName: string
  email: string
  avatarUrl?: string
  bio?: string
  role?: 'STUDENT' | 'ADMIN'
  isBanned?: boolean
}

export interface PasswordLoginPayload {
  email: string
  password: string
}

export interface PasswordRegisterPayload {
  email: string
  username: string
  fullName: string
  avatarUrl?: string
  bio?: string
  password: string
  confirmPassword: string
}

export interface PasswordChangePayload {
  currentPassword?: string
  newPassword: string
  confirmPassword: string
}

interface CachedValue<T> {
  value: T
  expiresAt: number
}

export class AuthApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'AuthApiError'
    this.status = status
  }
}

class AuthService {
  private accessToken: string | null = null
  private currentUserId: number | null = null
  private refreshTimer: ReturnType<typeof setTimeout> | null = null
  private refreshPromise: Promise<AuthResponse> | null = null
  private cache = new Map<string, CachedValue<unknown>>()
  private authStateVersion = 0

  private asAuthApiError(response: Response, fallbackMessage: string): AuthApiError {
    return new AuthApiError(response.status, `${fallbackMessage}: ${response.status}`)
  }

  private invalidateUserCache(userId?: number) {
    this.cache.delete('me')
    if (userId !== undefined) {
      this.cache.delete(`user:${userId}`)
    }
  }

  loginWithProvider(provider: 'google' | '42') {
    window.location.href = getApiUrl(`/api/public/auth/login/${provider}`)
  }

  async loginWithPassword(payload: PasswordLoginPayload): Promise<AuthResponse> {
    const response = await fetch(getApiUrl('/api/public/auth/password/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw this.asAuthApiError(response, 'Password login failed')
    }

    const data: AuthResponse = await response.json()
    this.setAccessToken(data.accessToken, data.expiresIn)
    this.currentUserId = data.user.id
    this.cacheUser('me', data.user)
    this.cacheUser(`user:${data.user.id}`, data.user)
    return data
  }

  async registerWithPassword(payload: PasswordRegisterPayload): Promise<AuthResponse> {
    const response = await fetch(getApiUrl('/api/public/auth/password/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw this.asAuthApiError(response, 'Registration failed')
    }

    const data: AuthResponse = await response.json()
    this.setAccessToken(data.accessToken, data.expiresIn)
    this.currentUserId = data.user.id
    this.cacheUser('me', data.user)
    this.cacheUser(`user:${data.user.id}`, data.user)
    return data
  }

  async updatePassword(payload: PasswordChangePayload): Promise<User> {
    const response = await this.authenticatedFetch(getApiUrl('/api/auth/me/password'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw this.asAuthApiError(response, 'Failed to update password')
    }

    const data: User = await response.json()
    this.currentUserId = data.id
    this.cacheUser('me', data)
    this.cacheUser(`user:${data.id}`, data)
    return data
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
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = this.performRefresh()
    try {
      return await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }

  private async performRefresh(): Promise<AuthResponse> {
    const refreshStartedAtVersion = this.authStateVersion
    const response = await fetch(getApiUrl('/api/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    })

    if (!response.ok) {
      throw this.asAuthApiError(response, 'Token refresh failed')
    }

    const data: AuthResponse = await response.json()
    if (refreshStartedAtVersion !== this.authStateVersion) {
      throw new Error('Stale refresh response discarded')
    }
    this.setAccessToken(data.accessToken, data.expiresIn)
    this.cacheUser('me', data.user)
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
      cache: options.cache ?? 'no-store',
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
        cache: options.cache ?? 'no-store',
      })
    }

    return response
  }

  async getCurrentUserProfile(force = false): Promise<User> {
    const cacheKey = 'me'
    const cached = this.getFromCache<User>(cacheKey)
    if (!force && cached) {
      return cached
    }

    const response = await this.authenticatedFetch(getApiUrl('/api/auth/me'))
    if (!response.ok) {
      throw this.asAuthApiError(response, 'Failed to fetch profile')
    }

    const data: User = await response.json()
    this.currentUserId = data.id
    this.cacheUser(cacheKey, data)
    return data
  }

  async updateCurrentUserProfile(payload: UserUpdatePayload): Promise<User> {
    this.invalidateUserCache()
    const response = await this.authenticatedFetch(getApiUrl('/api/auth/me'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      throw this.asAuthApiError(response, 'Failed to update profile')
    }

    const data: User = await response.json()
    this.currentUserId = data.id
    this.cacheUser('me', data)
    this.cacheUser(`user:${data.id}`, data)
    return data
  }

  async deleteCurrentUser(): Promise<void> {
    this.invalidateUserCache()
    const response = await this.authenticatedFetch(getApiUrl('/api/auth/delete'), {
      method: 'DELETE',
    })
    if (!response.ok && response.status !== 204) {
      throw this.asAuthApiError(response, 'Failed to delete account')
    }
    this.resetLocalAuthState()
  }

  async getUserById(userId: number, force = false): Promise<User> {
    const cacheKey = `user:${userId}`
    const cached = this.getFromCache<User>(cacheKey)
    if (!force && cached) {
      return cached
    }

    const response = await this.authenticatedFetch(getApiUrl(`/api/auth/users/${userId}`))
    if (!response.ok) {
      throw this.asAuthApiError(response, 'Failed to fetch user')
    }

    const data: User = await response.json()
    this.cacheUser(cacheKey, data)
    return data
  }

  async searchUsers(query: string, page = 0, size = 20): Promise<UserSummary[]> {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      size: size.toString(),
    })

    const response = await this.authenticatedFetch(getApiUrl(`/api/auth/users?${params.toString()}`))
    if (!response.ok) {
      throw this.asAuthApiError(response, 'Search failed')
    }

    return response.json()
  }

  async reloadIntraData(userId: number): Promise<User> {
    this.invalidateUserCache(userId)
    const response = await this.authenticatedFetch(getApiUrl(`/api/auth/reload?userId=${userId}`), {
      method: 'POST',
    })
    if (!response.ok) {
      throw this.asAuthApiError(response, 'Failed to reload 42 data')
    }

    const data: User = await response.json()
    if (this.currentUserId !== null && data.id === this.currentUserId) {
      this.cacheUser('me', data)
    }
    this.cacheUser(`user:${data.id}`, data)
    return data
  }

  async listSessions(): Promise<SessionInfo[]> {
    const response = await this.authenticatedFetch(getApiUrl('/api/auth/sessions'))
    if (!response.ok) {
      throw this.asAuthApiError(response, 'Failed to list sessions')
    }
    return response.json()
  }

  async logout(): Promise<void> {
    const response = await this.authenticatedFetch(getApiUrl('/api/auth/logout'), {
      method: 'POST',
      cache: 'no-store',
    })

    if (!response.ok && response.status !== 204) {
      throw this.asAuthApiError(response, 'Failed to logout')
    }

    this.resetLocalAuthState()
  }

  async logoutSession(sessionId: string): Promise<void> {
    const query = `?sessionId=${encodeURIComponent(sessionId)}`
    const response = await this.authenticatedFetch(getApiUrl(`/api/auth/logout${query}`), {
      method: 'POST',
    })

    if (!response.ok) {
      throw this.asAuthApiError(response, 'Failed to logout session')
    }
  }

  async logoutAll(): Promise<void> {
    const response = await this.authenticatedFetch(getApiUrl('/api/auth/logout/all'), {
      method: 'POST',
      cache: 'no-store',
    })

    if (!response.ok && response.status !== 204) {
      throw this.asAuthApiError(response, 'Failed to logout all sessions')
    }

    this.resetLocalAuthState()
  }

  async adminUpdateUser(userId: number, payload: AdminUpdatePayload): Promise<User> {
    this.invalidateUserCache(userId)
    const response = await this.authenticatedFetch(getApiUrl(`/api/auth/admin/users/${userId}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      throw this.asAuthApiError(response, 'Failed to update user')
    }
    const data: User = await response.json()
    this.cacheUser(`user:${data.id}`, data)
    return data
  }

  async adminLogoutUser(userId: number): Promise<void> {
    const response = await this.authenticatedFetch(getApiUrl(`/api/auth/admin/users/${userId}/logout`), {
      method: 'POST',
    })
    if (!response.ok) {
      throw this.asAuthApiError(response, 'Failed to logout user')
    }
  }

  async adminCreateUser(payload: CreateUserPayload): Promise<User> {
    this.invalidateUserCache()
    const response = await this.authenticatedFetch(getApiUrl('/api/auth/admin/users/create'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      throw this.asAuthApiError(response, 'Failed to create user')
    }
    return response.json()
  }

  async adminDeleteUser(userId: number): Promise<void> {
    this.invalidateUserCache(userId)
    const response = await this.authenticatedFetch(getApiUrl(`/api/auth/admin/users/${userId}/delete`), {
      method: 'DELETE',
    })
    if (!response.ok && response.status !== 204) {
      throw this.asAuthApiError(response, 'Failed to delete user')
    }
    this.cache.delete(`user:${userId}`)
  }

  private parseExpiresInSeconds(expiresIn: AuthResponse['expiresIn']): number {
    if (typeof expiresIn === 'number') {
      if (expiresIn > 1_000_000_000_000) {
        return Math.max(Math.floor((expiresIn - Date.now()) / 1000), 10)
      }
      if (expiresIn > 1_000_000_000) {
        return Math.max(Math.floor(expiresIn - Date.now() / 1000), 10)
      }
      return Math.max(Math.floor(expiresIn), 10)
    }

    if (typeof expiresIn === 'string') {
      const numeric = Number(expiresIn)
      if (Number.isFinite(numeric)) {
        return this.parseExpiresInSeconds(numeric)
      }
    }

    const dateValue = expiresIn instanceof Date ? expiresIn.getTime() : Date.parse(expiresIn)
    if (!Number.isNaN(dateValue)) {
      return Math.max(Math.floor((dateValue - Date.now()) / 1000), 10)
    }

    return 600
  }

  private setAccessToken(token: string, expiresIn: AuthResponse['expiresIn']) {
    this.accessToken = token

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    const secondsUntilExpiry = this.parseExpiresInSeconds(expiresIn)
    const refreshIn = Math.max(secondsUntilExpiry - 60, 10) * 1000
    this.refreshTimer = setTimeout(() => {
      this.refreshAccessToken().catch((error) => {
        console.error('Auto-refresh failed:', error)
        this.logout().catch(() => undefined)
      })
    }, refreshIn)
  }

  private cacheUser(key: string, user: User) {
    this.cache.set(key, {
      value: user,
      expiresAt: Date.now() + 30_000,
    })
  }

  private getFromCache<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null
    if (item.expiresAt < Date.now()) {
      this.cache.delete(key)
      return null
    }
    return item.value as T
  }

  private resetLocalAuthState() {
    this.authStateVersion += 1
    this.accessToken = null
    this.currentUserId = null
    this.cache.clear()

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  }
}

export const authService = new AuthService()
