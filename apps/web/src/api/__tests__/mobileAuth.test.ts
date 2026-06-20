import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the persistence layer and axios so we test transport logic only.
vi.mock('../mobileTokenStore', () => ({
  getRefreshToken: vi.fn(),
  setRefreshToken: vi.fn(),
}))
vi.mock('axios', () => ({
  default: { post: vi.fn() },
}))

import axios from 'axios'
import { mobileLogin, mobileGoogle, mobileRefresh } from '../mobileAuth'
import { getRefreshToken, setRefreshToken } from '../mobileTokenStore'
import { getApiBaseUrl } from '../config'

const post = axios.post as unknown as ReturnType<typeof vi.fn>
const getRT = getRefreshToken as unknown as ReturnType<typeof vi.fn>
const setRT = setRefreshToken as unknown as ReturnType<typeof vi.fn>

const RESULT = {
  accessToken: 'acc',
  refreshToken: 'ref',
  name: 'Tai',
  email: 't@x.com',
  role: 'USER',
}

beforeEach(() => {
  vi.clearAllMocks()
  // Absolute base so getApiBaseUrl() is happy under the capacitor target.
  vi.stubEnv('VITE_API_BASE_URL', 'https://be.quize.top')
})
afterEach(() => vi.unstubAllEnvs())

describe('mobileLogin', () => {
  it('posts to the mobile login endpoint and persists the refresh token', async () => {
    post.mockResolvedValueOnce({ data: RESULT })
    const r = await mobileLogin('t@x.com', 'pw')
    expect(post).toHaveBeenCalledWith('https://be.quize.top/api/auth/mobile/login', {
      email: 't@x.com',
      password: 'pw',
    })
    expect(setRT).toHaveBeenCalledWith('ref')
    expect(r.accessToken).toBe('acc')
  })
})

describe('mobileGoogle', () => {
  it('posts the idToken and persists the refresh token', async () => {
    post.mockResolvedValueOnce({ data: RESULT })
    await mobileGoogle('id-token')
    expect(post).toHaveBeenCalledWith('https://be.quize.top/api/auth/mobile/google', {
      idToken: 'id-token',
    })
    expect(setRT).toHaveBeenCalledWith('ref')
  })
})

describe('mobileRefresh', () => {
  it('returns null and does not call the API when no stored token', async () => {
    getRT.mockResolvedValueOnce(null)
    const r = await mobileRefresh()
    expect(r).toBeNull()
    expect(post).not.toHaveBeenCalled()
  })

  it('rotates and returns the new session on success', async () => {
    getRT.mockResolvedValueOnce('old-ref')
    post.mockResolvedValueOnce({ data: { ...RESULT, refreshToken: 'new-ref' } })
    const r = await mobileRefresh()
    expect(post).toHaveBeenCalledWith('https://be.quize.top/api/auth/mobile/refresh', {
      refreshToken: 'old-ref',
    })
    expect(setRT).toHaveBeenCalledWith('new-ref')
    expect(r?.accessToken).toBe('acc')
  })

  it('clears the stored token and returns null when the backend rejects it', async () => {
    getRT.mockResolvedValueOnce('bad-ref')
    post.mockRejectedValueOnce(new Error('401'))
    const r = await mobileRefresh()
    expect(r).toBeNull()
    expect(setRT).toHaveBeenCalledWith(null)
  })
})

describe('getApiBaseUrl capacitor guard', () => {
  it('throws for the capacitor target when no base URL is set', () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    vi.stubEnv('VITE_TARGET', 'capacitor')
    expect(() => getApiBaseUrl()).toThrow(/VITE_API_BASE_URL/)
  })

  it('returns empty string for the web target when no base URL is set', () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    vi.stubEnv('VITE_TARGET', '')
    expect(getApiBaseUrl()).toBe('')
  })
})
