import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRankedDataSync } from '../useRankedDataSync'

vi.mock('../../api/client', () => ({
  api: {
    get: vi.fn(),
  },
}))

import { api } from '../../api/client'
const mockedGet = vi.mocked(api.get)

describe('useRankedDataSync', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    // Fix date to 2026-04-16
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-04-16T10:00:00.000Z')
  })

  it('syncs ranked data on mount by calling /api/me/ranked-status', async () => {
    mockedGet.mockResolvedValue({ data: {} })

    renderHook(() => useRankedDataSync())

    await waitFor(() => {
      expect(mockedGet).toHaveBeenCalledWith('/api/me/ranked-status')
    })
  })

  it('sets isInitialized=true after successful sync', async () => {
    mockedGet.mockResolvedValue({ data: {} })

    const { result } = renderHook(() => useRankedDataSync())

    expect(result.current.isInitialized).toBe(false)

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })
  })

  it('clears stale askedQuestionIds from a previous day', async () => {
    localStorage.setItem('lastAskedDate', '2026-04-15')
    localStorage.setItem('askedQuestionIds', JSON.stringify(['q1', 'q2']))

    mockedGet.mockResolvedValue({ data: {} })

    renderHook(() => useRankedDataSync())

    await waitFor(() => {
      expect(localStorage.getItem('askedQuestionIds')).toBeNull()
      expect(localStorage.getItem('lastAskedDate')).toBe('2026-04-16')
    })
  })

  it('stores server askedQuestionIdsToday to localStorage', async () => {
    mockedGet.mockResolvedValue({
      data: { askedQuestionIdsToday: ['q10', 'q20', 'q30'] },
    })

    renderHook(() => useRankedDataSync())

    await waitFor(() => {
      expect(localStorage.getItem('askedQuestionIds')).toBe(
        JSON.stringify(['q10', 'q20', 'q30'])
      )
    })
  })

  it('handles API error gracefully and still sets isInitialized=true', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockedGet.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useRankedDataSync())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to initialize ranked data:',
      expect.any(Error)
    )
  })

  it('does not clear askedQuestionIds if same day', async () => {
    localStorage.setItem('lastAskedDate', '2026-04-16')
    localStorage.setItem('askedQuestionIds', JSON.stringify(['q1', 'q2']))

    mockedGet.mockResolvedValue({ data: {} })

    const { result } = renderHook(() => useRankedDataSync())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    // askedQuestionIds preserved (server returned empty, no overwrite)
    expect(localStorage.getItem('askedQuestionIds')).toBe(
      JSON.stringify(['q1', 'q2'])
    )
    expect(localStorage.getItem('lastAskedDate')).toBe('2026-04-16')
  })

  it('does not store askedQuestionIds when server returns empty array', async () => {
    mockedGet.mockResolvedValue({
      data: { askedQuestionIdsToday: [] },
    })

    const { result } = renderHook(() => useRankedDataSync())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    expect(localStorage.getItem('askedQuestionIds')).toBeNull()
  })

  it('does not store askedQuestionIds when server returns null', async () => {
    mockedGet.mockResolvedValue({
      data: { askedQuestionIdsToday: null },
    })

    const { result } = renderHook(() => useRankedDataSync())

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    expect(localStorage.getItem('askedQuestionIds')).toBeNull()
  })
})
