import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

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
  login: (tokens: { accessToken: string; refreshToken: string; name: string; email: string; avatar?: string }) => void
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

  const login = async (tokens: { accessToken: string; refreshToken: string; name: string; email: string; avatar?: string }) => {
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
    localStorage.setItem('userName', tokens.name)
    localStorage.setItem('userEmail', tokens.email)
    if (tokens.avatar) {
      localStorage.setItem('userAvatar', tokens.avatar)
    }
    
    setUser({
      name: tokens.name,
      email: tokens.email,
      avatar: tokens.avatar
    })
    
    // Restore ranked progress from database after login
    try {
      const today = new Date().toISOString().slice(0, 10)
      const currentSnapshot = localStorage.getItem('rankedSnapshot')
      
      // Only restore if localStorage is empty or has old data
      if (!currentSnapshot || JSON.parse(currentSnapshot).date !== today) {
        console.log('[AUTH_CONTEXT] Restoring ranked progress from database after login')
        // Trigger ranked data sync
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
    // Save current ranked progress to database before logout
    try {
      const rankedSnapshot = localStorage.getItem('rankedSnapshot')
      if (rankedSnapshot) {
        const data = JSON.parse(rankedSnapshot)
        if (data.questionsCounted > 0 || data.pointsToday > 0) {
          console.log('[AUTH_CONTEXT] Syncing ranked progress before logout:', data)
          // Call sync API to ensure data is saved to database
          const { api } = await import('../api/client')
          await api.post('/api/ranked/sync-progress')
          console.log('[AUTH_CONTEXT] Successfully synced progress to database')
        }
      }
    } catch (error) {
      console.warn('[AUTH_CONTEXT] Failed to sync ranked progress before logout:', error)
    }
    
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userAvatar')
    
    setUser(null)
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('[AUTH_CONTEXT] User logged out')
    }
  }

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken')
    const name = localStorage.getItem('userName')
    const email = localStorage.getItem('userEmail')
    const avatar = localStorage.getItem('userAvatar')

    if (token && name && email) {
      // Prime basic user info from localStorage
      setUser({ name, email, avatar: avatar || undefined })
      if (process.env.NODE_ENV !== 'production') {
        console.log('[AUTH_CONTEXT] User authenticated from localStorage:', name)
      }
      // Try to fetch role and fresh profile from backend
      try {
        const { api } = await import('../api/client')
        console.log('[AUTH_CONTEXT] Attempting to fetch /api/me with token:', token ? 'present' : 'missing')
        const res = await api.get('/api/me')
        const role = res.data?.role as string | undefined
        const updated: User = {
          name: res.data?.name ?? name,
          email: res.data?.email ?? email,
          avatar: res.data?.avatarUrl ?? avatar ?? undefined,
          role
        }
        setUser(updated)
        if (process.env.NODE_ENV !== 'production') {
          console.log('[AUTH_CONTEXT] Refreshed user profile from /api/me with role:', role)
        }
      } catch (e) {
        console.error('[AUTH_CONTEXT] Failed to fetch /api/me profile:', e)
        console.error('[AUTH_CONTEXT] Error details:', e.response?.data || e.message)
      }
    } else {
      setUser(null)
      if (process.env.NODE_ENV !== 'production') {
        console.log('[AUTH_CONTEXT] No valid authentication found')
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
