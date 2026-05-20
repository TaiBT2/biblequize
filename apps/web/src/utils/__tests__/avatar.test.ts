import { describe, it, expect } from 'vitest'
import { resolveAvatar, isGoogleAvatarUrl, isOAuthAvatarUrl } from '../avatar'

describe('resolveAvatar', () => {
  it('returns preset branch for known preset id', () => {
    const result = resolveAvatar('preset:disciple', 'Anh')
    expect(result.kind).toBe('preset')
    if (result.kind === 'preset') {
      expect(result.preset.id).toBe('disciple')
      expect(result.preset.emoji).toBe('🧔')
    }
  })

  it('falls back to initial when preset id is unknown', () => {
    const result = resolveAvatar('preset:does-not-exist', 'Phương')
    expect(result.kind).toBe('initial')
    if (result.kind === 'initial') expect(result.initial).toBe('P')
  })

  it('returns img branch for http(s) URL', () => {
    const url = 'https://lh3.googleusercontent.com/a/AAA=s96-c'
    const result = resolveAvatar(url, 'Anh')
    expect(result.kind).toBe('img')
    if (result.kind === 'img') expect(result.src).toBe(url)
  })

  it('returns initial branch when avatarUrl is null', () => {
    const result = resolveAvatar(null, 'minh')
    expect(result.kind).toBe('initial')
    if (result.kind === 'initial') expect(result.initial).toBe('M')
  })

  it('returns "?" initial when name is empty', () => {
    const result = resolveAvatar(undefined, '')
    expect(result.kind).toBe('initial')
    if (result.kind === 'initial') expect(result.initial).toBe('?')
  })

  it('handles unicode names', () => {
    const result = resolveAvatar(null, 'Đức')
    expect(result.kind).toBe('initial')
    if (result.kind === 'initial') expect(result.initial).toBe('Đ')
  })

  it('treats non-http strings (e.g. plain text) as initial fallback', () => {
    const result = resolveAvatar('not-a-url', 'Sara')
    expect(result.kind).toBe('initial')
    if (result.kind === 'initial') expect(result.initial).toBe('S')
  })
})

describe('isGoogleAvatarUrl / isOAuthAvatarUrl', () => {
  it('detects Google CDN', () => {
    expect(isGoogleAvatarUrl('https://lh3.googleusercontent.com/a/foo=s96-c')).toBe(true)
    expect(isOAuthAvatarUrl('https://lh5.googleusercontent.com/a/foo=s96-c')).toBe(true)
  })

  it('detects Facebook CDN', () => {
    expect(isOAuthAvatarUrl('https://scontent-sin11-1.xx.fbcdn.net/v/t1.6435-1/foo.jpg')).toBe(true)
  })

  it('rejects unrelated URLs and falsy', () => {
    expect(isGoogleAvatarUrl('https://example.com/me.jpg')).toBe(false)
    expect(isOAuthAvatarUrl('preset:disciple')).toBe(false)
    expect(isOAuthAvatarUrl(null)).toBe(false)
    expect(isOAuthAvatarUrl(undefined)).toBe(false)
  })
})
