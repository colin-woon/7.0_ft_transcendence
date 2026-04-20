# Frontend Authentication Integration Guide

This guide shows how to integrate your frontend with the Auth Service.

## Overview

The Auth Service provides OAuth-based authentication with JWT access tokens and HTTP-only refresh cookies.

**Token Strategy:**
- **Access Token**: Short-lived JWT (10 minutes), sent in `Authorization` header
- **Refresh Token**: Long-lived session (24 hours), stored in HTTP-only cookie

---

## TypeScript/React Example

### 1. Auth Service Client

```typescript
// src/services/authService.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  role: 'STUDENT' | 'ADMIN';
  isBanned: boolean;
  lastSeenAt: string;
  createdAt: string;
  linkedWithGoogle: boolean;
  linkedWithIntra: boolean;
}

interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: User;
}

class AuthService {
  private accessToken: string | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  /**
   * Initiate OAuth login flow
   */
  loginWithProvider(provider: 'google' | '42') {
    // Redirect to auth service OAuth endpoint
    window.location.href = `${API_BASE_URL}/api/public/auth/login/${provider}`;
  }

  /**
   * Handle OAuth callback - extract token from response
   * Call this when redirected back from OAuth
   */
  async handleOAuthCallback(): Promise<User | null> {
    try {
      // After OAuth redirect, the auth service returns the token
      // This assumes your backend redirects to frontend with token
      // Or you can fetch it if stored in cookie
      const response = await this.refreshAccessToken();
      return response.user;
    } catch (error) {
      console.error('OAuth callback failed:', error);
      return null;
    }
  }

  /**
   * Refresh access token using refresh cookie
   */
  async refreshAccessToken(): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // Important: sends cookies
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data: AuthResponse = await response.json();
    this.setAccessToken(data.accessToken, data.expiresIn);
    return data;
  }

  /**
   * Set access token and schedule auto-refresh
   */
  private setAccessToken(token: string, expiresIn: number) {
    this.accessToken = token;
    
    // Clear existing timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Schedule refresh 1 minute before expiry
    const refreshIn = (expiresIn - 60) * 1000;
    this.refreshTimer = setTimeout(() => {
      this.refreshAccessToken().catch(err => {
        console.error('Auto-refresh failed:', err);
        this.logout();
      });
    }, refreshIn);
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Make authenticated API request
   */
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = new Headers(options.headers);
    
    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    let response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies
    });

    // If 401, try refreshing token once
    if (response.status === 401) {
      try {
        await this.refreshAccessToken();
        
        // Retry original request with new token
        if (this.accessToken) {
          headers.set('Authorization', `Bearer ${this.accessToken}`);
        }
        
        response = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
        });
      } catch (error) {
        // Refresh failed, logout
        this.logout();
        throw error;
      }
    }

    return response;
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await this.authenticatedFetch(`${API_BASE_URL}/api/auth/me`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }

    return response.json();
  }

  /**
   * Update current user profile
   */
  async updateProfile(updates: {
    username?: string;
    fullName?: string;
    avatarUrl?: string;
    bio?: string;
  }): Promise<User> {
    const response = await this.authenticatedFetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to update profile');
    }

    return response.json();
  }

  /**
   * Search for users
   */
  async searchUsers(query: string, page = 0, size = 10): Promise<User[]> {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      size: size.toString(),
    });

    const response = await fetch(`${API_BASE_URL}/api/auth/users?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to search users');
    }

    return response.json();
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: number): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/api/auth/users/${userId}`);
    
    if (!response.ok) {
      throw new Error('User not found');
    }

    return response.json();
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await this.authenticatedFetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.accessToken = null;
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }
      // Redirect to login page
      window.location.href = '/login';
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<void> {
    await this.authenticatedFetch(`${API_BASE_URL}/api/auth/delete`, {
      method: 'DELETE',
    });
    
    this.accessToken = null;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }
}

export const authService = new AuthService();
export type { User, AuthResponse };
```

---

### 2. React Context Provider

```typescript
// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, User } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (provider: 'google' | '42') => void;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to restore session on mount
    const initAuth = async () => {
      try {
        const userData = await authService.refreshAccessToken();
        setUser(userData.user);
      } catch (error) {
        console.error('Failed to restore session:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (provider: 'google' | '42') => {
    authService.loginWithProvider(provider);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    const updatedUser = await authService.updateProfile(updates);
    setUser(updatedUser);
  };

  const refreshUser = async () => {
    const userData = await authService.getCurrentUser();
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

### 3. Protected Route Component

```typescript
// src/components/ProtectedRoute.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'ADMIN') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

---

### 4. Usage Example in Components

```typescript
// src/pages/LoginPage.tsx

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();

  return (
    <div className="login-page">
      <h1>Login</h1>
      <button onClick={() => login('google')}>
        Login with Google
      </button>
      <button onClick={() => login('42')}>
        Login with 42
      </button>
    </div>
  );
};
```

```typescript
// src/pages/ProfilePage.tsx

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const [bio, setBio] = useState(user?.bio || '');
  const [editing, setEditing] = useState(false);

  const handleSave = async () => {
    try {
      await updateProfile({ bio });
      setEditing(false);
      alert('Profile updated!');
    } catch (error) {
      alert('Failed to update profile');
    }
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      <h1>{user.fullName}</h1>
      <p>@{user.username}</p>
      <p>Email: {user.email}</p>
      
      {editing ? (
        <div>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div>
          <p>Bio: {user.bio || 'No bio'}</p>
          <button onClick={() => setEditing(true)}>Edit Bio</button>
        </div>
      )}
      
      <button onClick={logout}>Logout</button>
    </div>
  );
};
```

---

## Key Points

1. **Always use `credentials: 'include'`** when making requests to include cookies
2. **Implement auto-refresh** before token expiry (we refresh 1 minute early)
3. **Handle 401 errors** by attempting one refresh before logging out
4. **Store access token in memory** (not localStorage) for security
5. **Refresh cookie is HTTP-only** and managed automatically by browser

---

## CORS Configuration

Make sure your frontend origin is allowed in the Auth service:

```properties
# application.properties
quarkus.http.cors.origins=http://localhost:3000,https://yourdomain.com
```

---

## Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8002
```

---

## Error Handling

```typescript
try {
  const user = await authService.getCurrentUser();
} catch (error) {
  if (error.message.includes('401')) {
    // Unauthorized - redirect to login
  } else if (error.message.includes('403')) {
    // Forbidden - user is banned
  } else {
    // Network or other error
  }
}
```
