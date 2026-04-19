import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEarlyUnlockCelebration } from '../useEarlyUnlockCelebration'

const STORAGE_KEY = 'seenEarlyRankedUnlockAt:user@example.com'

describe('useEarlyUnlockCelebration', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('does not celebrate when backend timestamp is null', () => {
    const { result } = renderHook(() =>
      useEarlyUnlockCelebration({ earlyRankedUnlockedAt: null, userKey: 'user@example.com' }),
    )
    expect(result.current.shouldCelebrate).toBe(false)
  })

  it('does not celebrate when userKey is missing', () => {
    const { result } = renderHook(() =>
      useEarlyUnlockCelebration({ earlyRankedUnlockedAt: '2026-04-19T10:00:00', userKey: undefined }),
    )
    expect(result.current.shouldCelebrate).toBe(false)
  })

  it('celebrates on fresh unlock (no localStorage marker yet)', () => {
    const { result } = renderHook(() =>
      useEarlyUnlockCelebration({
        earlyRankedUnlockedAt: '2026-04-19T10:00:00',
        userKey: 'user@example.com',
      }),
    )
    expect(result.current.shouldCelebrate).toBe(true)
  })

  it('does NOT celebrate when marker matches timestamp (already seen)', () => {
    window.localStorage.setItem(STORAGE_KEY, '2026-04-19T10:00:00')
    const { result } = renderHook(() =>
      useEarlyUnlockCelebration({
        earlyRankedUnlockedAt: '2026-04-19T10:00:00',
        userKey: 'user@example.com',
      }),
    )
    expect(result.current.shouldCelebrate).toBe(false)
  })

  it('celebrates when backend timestamp is newer than marker', () => {
    window.localStorage.setItem(STORAGE_KEY, '2026-04-18T09:00:00')
    const { result } = renderHook(() =>
      useEarlyUnlockCelebration({
        earlyRankedUnlockedAt: '2026-04-19T10:00:00',
        userKey: 'user@example.com',
      }),
    )
    expect(result.current.shouldCelebrate).toBe(true)
  })

  it('dismiss() writes marker to localStorage and stops celebrating', () => {
    const { result } = renderHook(() =>
      useEarlyUnlockCelebration({
        earlyRankedUnlockedAt: '2026-04-19T10:00:00',
        userKey: 'user@example.com',
      }),
    )
    expect(result.current.shouldCelebrate).toBe(true)

    act(() => {
      result.current.dismiss()
    })

    expect(result.current.shouldCelebrate).toBe(false)
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('2026-04-19T10:00:00')
  })

  it('fails closed when localStorage.getItem throws', () => {
    const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('quota exceeded / private mode')
    })

    const { result } = renderHook(() =>
      useEarlyUnlockCelebration({
        earlyRankedUnlockedAt: '2026-04-19T10:00:00',
        userKey: 'user@example.com',
      }),
    )

    expect(result.current.shouldCelebrate).toBe(false)
    getSpy.mockRestore()
  })

  it('re-evaluates when userKey changes (different user on same browser)', () => {
    // User A has already seen their unlock event
    window.localStorage.setItem('seenEarlyRankedUnlockAt:a@example.com', '2026-04-19T10:00:00')

    const { result, rerender } = renderHook(
      ({ userKey }) =>
        useEarlyUnlockCelebration({
          earlyRankedUnlockedAt: '2026-04-19T10:00:00',
          userKey,
        }),
      { initialProps: { userKey: 'a@example.com' } },
    )
    expect(result.current.shouldCelebrate).toBe(false)

    // User B logs in — their marker doesn't exist, so they should celebrate
    rerender({ userKey: 'b@example.com' })
    expect(result.current.shouldCelebrate).toBe(true)
  })

  it('dismiss is a no-op when timestamp or userKey missing (no throw)', () => {
    const { result } = renderHook(() =>
      useEarlyUnlockCelebration({ earlyRankedUnlockedAt: null, userKey: undefined }),
    )
    expect(() => result.current.dismiss()).not.toThrow()
    expect(window.localStorage.length).toBe(0)
  })
})
