import { create } from 'zustand'
import { api } from '../api/client'

export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  role: string
  provider: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User, tokens: { accessToken: string; refreshToken: string }) => void
  logout: () => void
  checkAuth: () => Promise<void>
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: (user: User, tokens: { accessToken: string; refreshToken: string }) => {
    localStorage.setItem('accessToken', tokens.accessToken)
    localStorage.setItem('refreshToken', tokens.refreshToken)
    set({ user, isAuthenticated: true, isLoading: false })
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  checkAuth: async () => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      set({ isAuthenticated: false, isLoading: false })
      return
    }

    set({ isLoading: true })
    try {
      const response = await api.get('/auth/me')
      set({ 
        user: response.data, 
        isAuthenticated: true, 
        isLoading: false 
      })
    } catch (error) {
      console.error('Auth check failed:', error)
      set({ user: null, isAuthenticated: false, isLoading: false })
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  },

  setLoading: (loading: boolean) => set({ isLoading: loading })
}))
