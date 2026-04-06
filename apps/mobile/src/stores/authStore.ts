import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { setAccessToken } from '../api/tokenStore'
import { setRefreshToken, getRefreshToken } from '../api/tokenStore'

interface User {
  name: string
  email: string
  avatar?: string
  role?: string
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean

  login: (tokens: {
    accessToken: string
    refreshToken?: string
    name: string
    email: string
    avatar?: string
    role?: string
  }) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  login: async (tokens) => {
    // Access token in memory only
    setAccessToken(tokens.accessToken)

    // Refresh token in AsyncStorage (RN has no httpOnly cookie)
    if (tokens.refreshToken) {
      await setRefreshToken(tokens.refreshToken)
    }

    // Cache non-sensitive profile data
    await AsyncStorage.setItem('userName', tokens.name)
    await AsyncStorage.setItem('userEmail', tokens.email)
    if (tokens.avatar) {
      await AsyncStorage.setItem('userAvatar', tokens.avatar)
    }

    const user: User = {
      name: tokens.name,
      email: tokens.email,
      avatar: tokens.avatar,
      role: tokens.role,
    }

    set({
      user,
      isAuthenticated: true,
      isAdmin: user.role === 'ADMIN',
    })
  },

  logout: async () => {
    // Sync ranked progress before logout
    try {
      const { api } = await import('../api/client')
      await api.post('/api/auth/logout')
    } catch {
      // Logout request failed — continue cleanup
    }

    // Clear tokens
    setAccessToken(null)
    await setRefreshToken(null)

    // Clear profile cache
    await AsyncStorage.removeItem('userName')
    await AsyncStorage.removeItem('userEmail')
    await AsyncStorage.removeItem('userAvatar')

    set({ user: null, isAuthenticated: false, isAdmin: false })
  },

  checkAuth: async () => {
    // Skip refresh if user was never logged in
    const hadSession = await AsyncStorage.getItem('userName')
    if (!hadSession) {
      set({ user: null, isAuthenticated: false, isAdmin: false, isLoading: false })
      return
    }

    try {
      const refreshToken = await getRefreshToken()
      if (!refreshToken) throw new Error('No refresh token')

      const { api } = await import('../api/client')
      const refreshRes = await api.post('/api/auth/mobile/refresh', { refreshToken })
      const { accessToken, refreshToken: newRefreshToken } = refreshRes.data
      setAccessToken(accessToken)
      if (newRefreshToken) {
        await setRefreshToken(newRefreshToken)
      }

      // Fetch fresh profile
      const meRes = await api.get('/api/me')
      const role = meRes.data?.role | undefined
      const name = await AsyncStorage.getItem('userName')
      const email = await AsyncStorage.getItem('userEmail')
      const avatar = await AsyncStorage.getItem('userAvatar')

      const user: User = {
        name: meRes.data?.name ?? name ?? 'User',
        email: meRes.data?.email ?? email ?? '',
        avatar: meRes.data?.avatarUrl ?? avatar ?? undefined,
        role,
      }

      // Update profile cache
      await AsyncStorage.setItem('userName', user.name)
      await AsyncStorage.setItem('userEmail', user.email)
      if (user.avatar) await AsyncStorage.setItem('userAvatar', user.avatar)

      set({
        user,
        isAuthenticated: true,
        isAdmin: role === 'ADMIN',
      })
    } catch {
      // No valid session
      setAccessToken(null)
      set({ user: null, isAuthenticated: false, isAdmin: false })
    } finally {
      set({ isLoading: false })
    }
  },
}))

export const useAuth = () => useAuthStore()
