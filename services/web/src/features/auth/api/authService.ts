
function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) {
    console.error('NEXT_PUBLIC_API_URL is not set')
    return ''
  }
  return url
}

// ── Intra (42 School) Data Types ───────────────────────────────────────────
export interface IntraImage {
  link: string
  versions: {
    large: string
    medium: string
    small: string
  }
}

export interface IntraInfo {
  url: string
  phone: string | null
  kind: string
  image: IntraImage | null
  correctionPoints: number
  poolMonth: string | null
  poolYear: string | null
  location: string | null
  wallet: number
  isAlumni: boolean
  isActive: boolean
  // JSONB arrays from 42 API
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

// ── User Types ─────────────────────────────────────────────────────────────
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
  updatedAt: string
  createdAt: string
  linkedWithGoogle: boolean
  linkedWithIntra: boolean
  intraInfo: IntraInfo | null  // 42 School data if linked
}

export interface AuthResponse {
  accessToken: string
  expiresIn: number
  user: User
}

export interface UserSummary {
  id: number
  username: string
  fullName: string
  avatarUrl: string | null
}

export interface SearchResult {
  users: UserSummary[]
  total: number
  page: number
  size: number
}

class AuthService {
  private accessToken: string | null = null
  private refreshTimer: ReturnType<typeof setTimeout> | null = null

  // ── Login Flow ─────────────────────────────────────────────────────────────
  
  /**
   * Initiates OAuth login with Google or 42 (Intra)
   * Redirects browser to auth service OAuth endpoint
   */
  loginWithProvider(provider: 'google' | '42') {
    // Capture current page for return_to redirect after OAuth
    const currentPath = window.location.pathname + window.location.search
    // Redirect to backend OAuth initiator endpoint through gateway (with /api/public prefix)
    window.location.href = `${getApiBaseUrl()}/api/public/auth/login/${provider}`
  }

  /**
   * Called after OAuth redirect back to /callback
   * Exchanges auth code for access token via refresh endpoint
   */
  async handleOAuthCallback(): Promise<User | null> {
    try {
      const response = await this.refreshAccessToken()
      return response.user
    } catch (error) {
      console.error('OAuth callback failed:', error)
      return null
    }
  }

  // ── Token Management ───────────────────────────────────────────────────────

  /**
   * Refreshes access token using HttpOnly session cookie
   * Called on app initialization and when token expires
   */
  async refreshAccessToken(): Promise<AuthResponse> {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',  // ⭐ Include HttpOnly session cookie
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`)
    }

    const data: AuthResponse = await response.json()
    this.setAccessToken(data.accessToken, data.expiresIn)
    return data
  }

  /**
   * Get current access token (stored in memory, not localStorage)
   */
  getAccessToken(): string | null {
    return this.accessToken
  }

  /**
   * Make authenticated API calls with automatic token refresh on 401
   * Uses token in Authorization header + includes session cookie
   */
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

    // If token expired (401), refresh and retry
    if (response.status === 401) {
      try {
        await this.refreshAccessToken()
        if (this.accessToken) {
          headers.set('Authorization', `Bearer ${this.accessToken}`)
        }
        response = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        })
      } catch {
        // Refresh failed - let 401 propagate
        return response
      }
    }

    return response
  }

  // ── Profile & User Data ────────────────────────────────────────────────────

  /**
   * Fetch current user's complete profile
   */
  async getCurrentUserProfile(): Promise<User> {
    const response = await this.authenticatedFetch(`${getApiBaseUrl()}/api/auth/me`)
    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.status}`)
    }
    return response.json()
  }

  /**
   * Update current user's profile
   */
  async updateUserProfile(updates: Partial<User>): Promise<User> {
    const response = await this.authenticatedFetch(`${getApiBaseUrl()}/api/auth/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (!response.ok) {
      throw new Error(`Failed to update profile: ${response.status}`)
    }
    return response.json()
  }

  /**
   * Fetch a specific user by ID
   */
  async getUserById(userId: number): Promise<User> {
    const response = await this.authenticatedFetch(`${getApiBaseUrl()}/api/auth/users/${userId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`)
    }
    return response.json()
  }

  // ── Search & Discovery ─────────────────────────────────────────────────────

  /**
   * Search for users by username, email, or fullName
   */
  async searchUsers(query: string, page: number = 0, size: number = 20): Promise<SearchResult> {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      size: size.toString(),
    })
    const response = await this.authenticatedFetch(
      `${getApiBaseUrl()}/api/auth/users?${params}`,
    )
    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`)
    }
    return response.json()
  }

  // ── 42 Intra Integration ───────────────────────────────────────────────────

  /**
   * Reload user's 42 School data from intra.42.fr API
   * Use when you want fresh data without re-authenticating
   */
  async reloadIntraData(userId: number): Promise<User> {
    const response = await this.authenticatedFetch(`${getApiBaseUrl()}/api/auth/reload?userId=${userId}`, {
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error(`Failed to reload Intra data: ${response.status}`)
    }
    return response.json()
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  /**
   * Logout current session
   */
  async logout(): Promise<void> {
    try {
      await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
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

  // ── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Set access token and schedule auto-refresh 60 seconds before expiry
   */
  private setAccessToken(token: string, expiresIn: number) {
    this.accessToken = token

    // Clear any existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    // Schedule refresh 60 seconds before expiry, min 10 seconds
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
