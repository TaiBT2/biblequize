import { create } from 'zustand'
import { setAccessToken } from '../api/tokenStore'
import { notifyRankedDataCleared } from '../utils/localStorageClearDetector'
import { isCapacitor } from '../platform/capacitor'

interface User {
  name: string
  email: string
  avatar?: string
  role?: string
  currentStreak?: number
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean

  login: (tokens: { accessToken: string; name: string; email: string; avatar?: string; role?: string }) => void
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setLoading: (loading: boolean) => void
  // Sync in-memory user + localStorage cache after an in-app profile edit
  // (PATCH /api/me) so header dropdown / sidebar reflect the new name/avatar
  // immediately, without waiting for the next checkAuth (page reload).
  updateProfile: (updates: { name?: string; avatar?: string | null }) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  updateProfile: (updates) => {
    const current = get().user
    if (!current) return
    const next: User = { ...current }
    if (updates.name !== undefined) {
      next.name = updates.name
      localStorage.setItem('userName', updates.name)
    }
    if (updates.avatar !== undefined) {
      // Empty string / null = cleared avatar → fall back to initial elsewhere.
      next.avatar = updates.avatar || undefined
      if (updates.avatar) localStorage.setItem('userAvatar', updates.avatar)
      else localStorage.removeItem('userAvatar')
    }
    set({ user: next })
  },

  login: (tokens) => {
    // Access token stored in memory only — not localStorage (XSS protection)
    setAccessToken(tokens.accessToken)
    // Only non-sensitive user profile data goes to localStorage
    localStorage.setItem('userName', tokens.name)
    localStorage.setItem('userEmail', tokens.email)
    if (tokens.avatar) {
      localStorage.setItem('userAvatar', tokens.avatar)
    }

    const normalizedRole = tokens.role?.toUpperCase()
    const user: User = {
      name: tokens.name,
      email: tokens.email,
      avatar: tokens.avatar,
      role: normalizedRole
    }

    set({
      user,
      isAuthenticated: true,
      isAdmin: normalizedRole === 'ADMIN'
    })

    // Restore ranked progress from database after login
    try {
      const today = new Date().toISOString().slice(0, 10)
      const currentSnapshot = localStorage.getItem('rankedSnapshot')
      if (!currentSnapshot || JSON.parse(currentSnapshot).date !== today) {
        if (import.meta.env.DEV) {
          console.log('[AUTH_STORE] Restoring ranked progress from database after login')
        }
        notifyRankedDataCleared()
      }
    } catch (error) {
      console.warn('[AUTH_STORE] Failed to restore ranked progress after login:', error)
    }

    if (import.meta.env.DEV) {
      console.log('[AUTH_STORE] User logged in:', tokens.name)
    }
  },

  logout: async () => {
    // Sync ranked progress before logout
    try {
      const rankedSnapshot = localStorage.getItem('rankedSnapshot')
      if (rankedSnapshot) {
        const data = JSON.parse(rankedSnapshot)
        if (data.questionsCounted > 0 || data.pointsToday > 0) {
          if (import.meta.env.DEV) {
            console.log('[AUTH_STORE] Syncing ranked progress before logout:', data)
          }
          const { api } = await import('../api/client')
          await api.post('/api/ranked/sync-progress')
        }
      }
    } catch (error) {
      console.warn('[AUTH_STORE] Failed to sync ranked progress before logout:', error)
    }

    // Blacklist current access token and clear the httpOnly refresh cookie
    try {
      const { api } = await import('../api/client')
      await api.post('/api/auth/logout')
    } catch (error) {
      console.warn('[AUTH_STORE] Logout request failed:', error)
    }

    // Mobile: drop the persisted refresh token (web uses the httpOnly cookie,
    // already cleared by /api/auth/logout above).
    if (isCapacitor()) {
      try {
        const { setRefreshToken } = await import('../api/mobileTokenStore')
        await setRefreshToken(null)
      } catch (error) {
        console.warn('[AUTH_STORE] Failed to clear mobile refresh token:', error)
      }
    }

    // Clear in-memory access token
    setAccessToken(null)
    // Clear profile data from localStorage
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('userAvatar')

    set({ user: null, isAuthenticated: false, isAdmin: false })

    if (import.meta.env.DEV) {
      console.log('[AUTH_STORE] User logged out')
    }
  },

  checkAuth: async () => {
    // Mobile (Capacitor): the session validator is the persisted refresh token,
    // not the httpOnly cookie. mobileRefresh() returns the profile too, so no
    // separate /api/me round-trip is needed on startup.
    if (isCapacitor()) {
      const { mobileRefresh } = await import('../api/mobileAuth')
      const result = await mobileRefresh()
      if (!result) {
        setAccessToken(null)
        set({ user: null, isAuthenticated: false, isAdmin: false, isLoading: false })
        return
      }
      setAccessToken(result.accessToken)
      const normalizedRole = result.role?.toUpperCase()
      localStorage.setItem('userName', result.name)
      localStorage.setItem('userEmail', result.email)
      if (result.avatar) localStorage.setItem('userAvatar', result.avatar)
      set({
        user: {
          name: result.name,
          email: result.email,
          avatar: result.avatar || undefined,
          role: normalizedRole,
        },
        isAuthenticated: true,
        isAdmin: normalizedRole === 'ADMIN',
        isLoading: false,
      })
      return
    }

    // Skip refresh if user was never logged in (no cached profile)
    // This avoids a 401 console error on guest/landing pages
    const hadSession = localStorage.getItem('userName')
    if (!hadSession) {
      set({ user: null, isAuthenticated: false, isAdmin: false, isLoading: false })
      return
    }

    // Skip refresh on /auth/callback — AuthCallback.tsx owns the OAuth code
    // exchange flow and will populate the store itself. Running checkAuth
    // in parallel races a stale refresh-cookie call against the fresh login,
    // producing harmless but noisy /api/me 404s in the console.
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/auth/callback')) {
      set({ isLoading: false })
      return
    }

    const { api } = await import('../api/client')

    // Step 1 — Refresh. This is the session validator: the backend re-checks
    // the user against the DB, so a 401 here means the session is genuinely
    // dead (token expired/revoked, or the user no longer exists). Only then do
    // we clear the cached profile. Network/5xx errors are transient — keep the
    // cached profile so the next load can retry.
    let accessToken: string | undefined
    try {
      if (import.meta.env.DEV) {
        console.log('[AUTH_STORE] Attempting token refresh on startup')
      }
      const refreshRes = await api.post('/api/auth/refresh')
      accessToken = refreshRes.data?.accessToken
      setAccessToken(accessToken ?? null)
    } catch (err: any) {
      setAccessToken(null)
      const status = err?.response?.status
      if (status === 401) {
        localStorage.removeItem('userName')
        localStorage.removeItem('userEmail')
        localStorage.removeItem('userAvatar')
      }
      set({ user: null, isAuthenticated: false, isAdmin: false, isLoading: false })
      if (import.meta.env.DEV) {
        console.log('[AUTH_STORE] No valid session found', status ? `(${status})` : '')
      }
      return
    }

    // Step 2 — Fetch fresh profile. The session is already valid (refresh
    // succeeded), so a failure here is a server/transient issue (e.g. a /api/me
    // 404 from a backend hiccup) and must NOT log the user out. Fall back to the
    // cached profile and stay authenticated.
    try {
      const meRes = await api.get('/api/me')
      const normalizedRole = (meRes.data?.role as string | undefined)?.toUpperCase()
      const name = localStorage.getItem('userName')
      const email = localStorage.getItem('userEmail')
      const avatar = localStorage.getItem('userAvatar')

      const user: User = {
        name: meRes.data?.name ?? name ?? 'User',
        email: meRes.data?.email ?? email ?? '',
        avatar: meRes.data?.avatarUrl ?? avatar ?? undefined,
        role: normalizedRole,
        currentStreak: typeof meRes.data?.currentStreak === 'number' ? meRes.data.currentStreak : undefined,
      }
      // Update localStorage profile cache
      localStorage.setItem('userName', user.name)
      localStorage.setItem('userEmail', user.email)
      if (user.avatar) localStorage.setItem('userAvatar', user.avatar)

      set({
        user,
        isAuthenticated: true,
        isAdmin: normalizedRole === 'ADMIN'
      })

      if (import.meta.env.DEV) {
        console.log('[AUTH_STORE] Session restored, role:', normalizedRole)
      }
    } catch (err: any) {
      // Session is valid (refresh succeeded) but the profile fetch failed —
      // keep the user logged in with the cached profile. Role is unknown until
      // /api/me recovers, so default isAdmin to false.
      const name = localStorage.getItem('userName')
      const email = localStorage.getItem('userEmail')
      const avatar = localStorage.getItem('userAvatar') ?? undefined
      set({
        user: { name: name ?? 'User', email: email ?? '', avatar },
        isAuthenticated: true,
        isAdmin: false,
      })
      if (import.meta.env.DEV) {
        const status = err?.response?.status
        console.warn('[AUTH_STORE] Session valid but /api/me failed; using cached profile',
          status ? `(${status})` : '')
      }
    } finally {
      set({ isLoading: false })
    }
  }
}))

// Backward-compatible hook name
export const useAuth = () => useAuthStore()
