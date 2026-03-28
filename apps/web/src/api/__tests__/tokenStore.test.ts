import { describe, it, expect, beforeEach } from 'vitest'
import { setAccessToken, getAccessToken } from '../tokenStore'

describe('tokenStore', () => {
  beforeEach(() => {
    setAccessToken(null)
  })

  it('should return null initially', () => {
    expect(getAccessToken()).toBeNull()
  })

  it('should store and retrieve a token', () => {
    setAccessToken('my-jwt-token')
    expect(getAccessToken()).toBe('my-jwt-token')
  })

  it('should overwrite existing token', () => {
    setAccessToken('first-token')
    setAccessToken('second-token')
    expect(getAccessToken()).toBe('second-token')
  })

  it('should clear token when set to null', () => {
    setAccessToken('my-token')
    setAccessToken(null)
    expect(getAccessToken()).toBeNull()
  })
})
