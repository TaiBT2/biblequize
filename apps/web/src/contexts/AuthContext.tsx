import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface User {
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (tokens: { accessToken: string; refreshToken: string; name: string; email: string }) => void
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

  const login = (tokens: { accessToken: string; refreshToken: string; name: string; email: string }) => {
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
    localStorage.setItem('userName', tokens.name)
    localStorage.setItem('userEmail', tokens.email)
    
    setUser({
      name: tokens.name,
      email: tokens.email
    })
    
    console.log('[AUTH_CONTEXT] User logged in:', tokens.name)
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
    
    setUser(null)
    
    console.log('[AUTH_CONTEXT] User logged out')
  }

  const checkAuth = () => {
    const token = localStorage.getItem('accessToken')
    const name = localStorage.getItem('userName')
    const email = localStorage.getItem('userEmail')

    if (token && name && email) {
      setUser({ name, email })
      console.log('[AUTH_CONTEXT] User authenticated from localStorage:', name)
    } else {
      setUser(null)
      console.log('[AUTH_CONTEXT] No valid authentication found')
    }
  }

  useEffect(() => {
    checkAuth()
    setIsLoading(false)
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
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
