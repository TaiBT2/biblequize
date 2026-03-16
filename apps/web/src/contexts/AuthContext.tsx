import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { setAccessToken } from '../api/tokenStore'

interface User {
  name: string
  email: string
  avatar?: string
  role?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isAdmin: boolean
  login: (tokens: { accessToken: string; name: string; email: string; avatar?: string; role?: string }) => void
  logout: () => void
  checkAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user
  const isAdmin = !!user && user.role === 'ADMIN'

  const login = (tokens: { accessToken: string; name: string; email: string; avatar?: string; role?: string }) => {
    // Access token stored in memory only — not localStorage (XSS protection)
    setAccessToken(tokens.accessToken)
    // Only non-sensitive user profile data goes to localStorage
    localStorage.setItem('userName', tokens.name)
    localStorage.setItem('userEmail', tokens.email)
    if (tokens.avatar) {
      localStorage.setItem('userAvatar', tokens.avatar)
    }

    setUser({
      name: tokens.name,
      email: tokens.email,
      avatar: tokens.avatar,
      role: tokens.role
    })

    // Restore ranked progress from database after login
    try {
      const today = new Date().toISOString().slice(0, 10)
      const currentSnapshot = localStorage.getItem('rankedSnapshot')
      if (!currentSnapshot || JSON.parse(currentSnapshot).date !== today) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[AUTH_CONTEXT] Restoring ranked progress from database after login')
        }
        window.dispatchEvent(new CustomEvent('localStorageCleared'))
      }
    } catch (error) {
      console.warn('[AUTH_CONTEXT] Failed to restore ranked progress after login:', error)
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[AUTH_CONTEXT] User logged in:', tokens.name)
    }
  }

  const logout = async () => {
    // Sync ranked progress before logout
    try {
      const rankedSnapshot = localStorage.getItem('rankedSnapshot')
      if (rankedSnapshot) {
        const data = JSON.parse(rankedSnapshot)
        if (data.questionsCounted > 0 || data.pointsToday > 0) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[AUTH_CONTEXT] Syncing ranked progress before logout:', data)
          }
          const { api } = await import('../api/client')
          await api.post('/api/ranked/sync-progress')
        }
      }
    } catch (error) {
      console.warn('[AUTH_CONTEXT] Failed to sync ranked progress before logout:', error)
    }

    // Blacklist current access token and clear the httpOnly refresh cookie
    try {
      const { api } = await import('../api/client')
      await api.post('/api/auth/logout')
    } catch (error) {
      console.warn('[AUTH_CONTEXT] Logout request failed:', error)
    }

    // Clear in-memory access token
    setAccessToken(null)
    // Clear profile data from localStorage
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userAvatar')

    setUser(null)

    if (process.env.NODE_ENV !== 'production') {
      console.log('[AUTH_CONTEXT] User logged out')
    }
  }

  const checkAuth = async () => {
    const name = localStorage.getItem('userName')
    const email = localStorage.getItem('userEmail')
    const avatar = localStorage.getItem('userAvatar')

    // Try to restore session by refreshing the access token via httpOnly cookie
    try {
      const { api } = await import('../api/client')
      if (process.env.NODE_ENV !== 'production') {
        console.log('[AUTH_CONTEXT] Attempting token refresh on startup')
      }
      const refreshRes = await api.post('/api/auth/refresh')
      const { accessToken } = refreshRes.data
      setAccessToken(accessToken)

      // Fetch fresh profile
      const meRes = await api.get('/api/me')
      const role = meRes.data?.role as string | undefined
      const updated: User = {
        name: meRes.data?.name ?? name ?? 'User',
        email: meRes.data?.email ?? email ?? '',
        avatar: meRes.data?.avatarUrl ?? avatar ?? undefined,
        role
      }
      // Update localStorage profile cache
      localStorage.setItem('userName', updated.name)
      localStorage.setItem('userEmail', updated.email)
      if (updated.avatar) localStorage.setItem('userAvatar', updated.avatar)

      setUser(updated)
      if (process.env.NODE_ENV !== 'production') {
        console.log('[AUTH_CONTEXT] Session restored, role:', role)
      }
    } catch (e) {
      // No valid session (refresh token missing or expired)
      setAccessToken(null)
      setUser(null)
      if (process.env.NODE_ENV !== 'production') {
        console.log('[AUTH_CONTEXT] No valid session found')
      }
    }
  }

  useEffect(() => {
    ;(async () => {
      await checkAuth()
      setIsLoading(false)
    })()
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    login,
    logout,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
