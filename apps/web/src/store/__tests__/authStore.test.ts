import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from '@testing-library/react'

/**
 * Tests for authStore — the central authentication state manager.
 * Covers: login, logout, checkAuth, role-based flags, localStorage sync.
 */

// Mock token store
const mockSetAccessToken = vi.fn()
vi.mock('../../api/tokenStore', () => ({
  setAccessToken: (token: string | null) => mockSetAccessToken(token),
}))

// Mock API client
const mockApiPost = vi.fn()
const mockApiGet = vi.fn()
vi.mock('../../api/client', () => ({
  api: {
    post: (...args: any[]) => mockApiPost(...args),
    get: (...args: any[]) => mockApiGet(...args),
  },
}))

// Mock localStorage clear detector
vi.mock('../../utils/localStorageClearDetector', () => ({
  notifyRankedDataCleared: vi.fn(),
  initStorageSync: vi.fn(),
}))

// Import after mocks
import { useAuthStore } from '../authStore'

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    // Reset store to initial state
    useAuthStore.setState({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      isAdmin: false,
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('initial state', () => {
    it('starts with user null and isLoading true', () => {
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isLoading).toBe(true)
      expect(state.isAuthenticated).toBe(false)
      expect(state.isAdmin).toBe(false)
    })
  })

  describe('login', () => {
    it('sets user and isAuthenticated to true', () => {
      act(() => {
        useAuthStore.getState().login({
          accessToken: 'test-token',
          name: 'Nguyễn Văn A',
          email: 'test@example.com',
        })
      })

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user?.name).toBe('Nguyễn Văn A')
      expect(state.user?.email).toBe('test@example.com')
    })

    it('stores access token in memory via setAccessToken', () => {
      act(() => {
        useAuthStore.getState().login({
          accessToken: 'my-jwt-token',
          name: 'Test',
          email: 'test@test.com',
        })
      })

      expect(mockSetAccessToken).toHaveBeenCalledWith('my-jwt-token')
    })

    it('saves name and email to localStorage (NOT token)', () => {
      act(() => {
        useAuthStore.getState().login({
          accessToken: 'secret-token',
          name: 'Minh',
          email: 'minh@church.vn',
          avatar: 'https://example.com/avatar.jpg',
        })
      })

      expect(localStorage.getItem('userName')).toBe('Minh')
      expect(localStorage.getItem('userEmail')).toBe('minh@church.vn')
      expect(localStorage.getItem('userAvatar')).toBe('https://example.com/avatar.jpg')
      // Token should NOT be in localStorage
      expect(localStorage.getItem('accessToken')).toBeNull()
    })

    it('sets isAdmin true when role is ADMIN', () => {
      act(() => {
        useAuthStore.getState().login({
          accessToken: 'token',
          name: 'Admin',
          email: 'admin@test.com',
          role: 'ADMIN',
        })
      })

      expect(useAuthStore.getState().isAdmin).toBe(true)
    })

    it('sets isAdmin false when role is not ADMIN', () => {
      act(() => {
        useAuthStore.getState().login({
          accessToken: 'token',
          name: 'User',
          email: 'user@test.com',
          role: 'USER',
        })
      })

      expect(useAuthStore.getState().isAdmin).toBe(false)
    })

    it('sets isAdmin false when role is undefined', () => {
      act(() => {
        useAuthStore.getState().login({
          accessToken: 'token',
          name: 'User',
          email: 'user@test.com',
        })
      })

      expect(useAuthStore.getState().isAdmin).toBe(false)
    })
  })

  describe('logout', () => {
    it('clears user and sets isAuthenticated to false', async () => {
      // Login first
      act(() => {
        useAuthStore.getState().login({
          accessToken: 'token',
          name: 'Test',
          email: 'test@test.com',
        })
      })
      expect(useAuthStore.getState().isAuthenticated).toBe(true)

      // Logout
      mockApiPost.mockResolvedValue({})
      await act(async () => {
        await useAuthStore.getState().logout()
      })

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isAdmin).toBe(false)
    })

    it('clears localStorage profile data', async () => {
      localStorage.setItem('userName', 'Test')
      localStorage.setItem('userEmail', 'test@test.com')
      localStorage.setItem('userAvatar', 'avatar.jpg')

      mockApiPost.mockResolvedValue({})
      await act(async () => {
        await useAuthStore.getState().logout()
      })

      expect(localStorage.getItem('userName')).toBeNull()
      expect(localStorage.getItem('userEmail')).toBeNull()
      expect(localStorage.getItem('userAvatar')).toBeNull()
    })

    it('clears in-memory access token', async () => {
      mockApiPost.mockResolvedValue({})
      await act(async () => {
        await useAuthStore.getState().logout()
      })

      expect(mockSetAccessToken).toHaveBeenCalledWith(null)
    })

    it('calls logout API to blacklist token', async () => {
      mockApiPost.mockResolvedValue({})
      await act(async () => {
        await useAuthStore.getState().logout()
      })

      expect(mockApiPost).toHaveBeenCalledWith('/api/auth/logout')
    })

    it('still clears state even if API call fails', async () => {
      act(() => {
        useAuthStore.getState().login({
          accessToken: 'token',
          name: 'Test',
          email: 'test@test.com',
        })
      })

      mockApiPost.mockRejectedValue(new Error('Network error'))
      await act(async () => {
        await useAuthStore.getState().logout()
      })

      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().user).toBeNull()
    })
  })

  describe('checkAuth', () => {
    it('restores session when refresh token is valid', async () => {
      localStorage.setItem('userName', 'Restored')
      mockApiPost.mockResolvedValue({ data: { accessToken: 'new-token' } })
      mockApiGet.mockResolvedValue({
        data: { name: 'Restored', email: 'restored@test.com', role: 'USER' },
      })

      await act(async () => {
        await useAuthStore.getState().checkAuth()
      })

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user?.name).toBe('Restored')
      expect(state.isLoading).toBe(false)
    })

    it('skips refresh and sets guest state when no cached session', async () => {
      // No userName in localStorage → should skip API call entirely
      await act(async () => {
        await useAuthStore.getState().checkAuth()
      })

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
    })

    it('sets isAdmin when restored user has ADMIN role', async () => {
      localStorage.setItem('userName', 'Admin')
      mockApiPost.mockResolvedValue({ data: { accessToken: 'admin-token' } })
      mockApiGet.mockResolvedValue({
        data: { name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
      })

      await act(async () => {
        await useAuthStore.getState().checkAuth()
      })

      expect(useAuthStore.getState().isAdmin).toBe(true)
    })

    it('always sets isLoading false even on error', async () => {
      localStorage.setItem('userName', 'Test')
      mockApiPost.mockRejectedValue(new Error('Network'))

      await act(async () => {
        await useAuthStore.getState().checkAuth()
      })

      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe('setLoading', () => {
    it('updates isLoading state', () => {
      act(() => {
        useAuthStore.getState().setLoading(false)
      })
      expect(useAuthStore.getState().isLoading).toBe(false)

      act(() => {
        useAuthStore.getState().setLoading(true)
      })
      expect(useAuthStore.getState().isLoading).toBe(true)
    })
  })
})
