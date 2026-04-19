import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

/**
 * Tests for {@link useLifeline}.
 *
 * Mocks the api client module and asserts the hook's state transitions
 * across status fetch, hint mutation, questionId reset, and error paths.
 */

const mockGet = vi.fn()
const mockPost = vi.fn()
vi.mock('../../api/client', () => ({
  api: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
  },
}))

// Import after mock is registered
import { useLifeline } from '../useLifeline'

function successStatus(overrides: Partial<any> = {}) {
  return {
    data: {
      hintsRemaining: 2,
      hintQuota: 2,
      eliminatedOptions: [],
      mode: 'ranked',
      askOpinionAvailable: false,
      ...overrides,
    },
  }
}

describe('useLifeline', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does nothing when disabled', async () => {
    const { result } = renderHook(() =>
      useLifeline({ sessionId: 's1', questionId: 'q1', enabled: false })
    )

    expect(result.current.canUseHint).toBe(false)
    expect(mockGet).not.toHaveBeenCalled()
  })

  it('fetches status on mount', async () => {
    mockGet.mockResolvedValueOnce(successStatus())

    const { result } = renderHook(() =>
      useLifeline({ sessionId: 's1', questionId: 'q1' })
    )

    await waitFor(() => expect(result.current.status).not.toBeNull())
    expect(mockGet).toHaveBeenCalledWith(
      '/api/sessions/s1/lifeline/status',
      { params: { questionId: 'q1' } }
    )
    expect(result.current.hintsRemaining).toBe(2)
    expect(result.current.canUseHint).toBe(true)
  })

  it('hydrates eliminated options from server status', async () => {
    mockGet.mockResolvedValueOnce(successStatus({ eliminatedOptions: [3] }))

    const { result } = renderHook(() =>
      useLifeline({ sessionId: 's1', questionId: 'q1' })
    )

    await waitFor(() => expect(result.current.eliminatedOptions.has(3)).toBe(true))
  })

  it('merges new eliminated index after useHint success', async () => {
    mockGet.mockResolvedValueOnce(successStatus())
    mockPost.mockResolvedValueOnce({
      data: { eliminatedOptionIndex: 2, hintsRemaining: 1, method: 'RANDOM' },
    })

    const { result } = renderHook(() =>
      useLifeline({ sessionId: 's1', questionId: 'q1' })
    )
    await waitFor(() => expect(result.current.status).not.toBeNull())

    await act(async () => {
      await result.current.useHint()
    })

    expect(result.current.eliminatedOptions.has(2)).toBe(true)
    expect(result.current.hintsRemaining).toBe(1)
    expect(mockPost).toHaveBeenCalledWith(
      '/api/sessions/s1/lifeline/hint',
      { questionId: 'q1' }
    )
  })

  it('disables canUseHint when quota is 0', async () => {
    mockGet.mockResolvedValueOnce(successStatus({ hintQuota: 0, hintsRemaining: 0 }))

    const { result } = renderHook(() =>
      useLifeline({ sessionId: 's1', questionId: 'q1' })
    )
    await waitFor(() => expect(result.current.status).not.toBeNull())

    expect(result.current.canUseHint).toBe(false)
  })

  it('disables canUseHint when hintsRemaining is 0', async () => {
    mockGet.mockResolvedValueOnce(successStatus({ hintsRemaining: 0 }))

    const { result } = renderHook(() =>
      useLifeline({ sessionId: 's1', questionId: 'q1' })
    )
    await waitFor(() => expect(result.current.status).not.toBeNull())

    expect(result.current.canUseHint).toBe(false)
  })

  it('allows hints when remaining is -1 (unlimited)', async () => {
    mockGet.mockResolvedValueOnce(successStatus({ hintQuota: -1, hintsRemaining: -1 }))

    const { result } = renderHook(() =>
      useLifeline({ sessionId: 's1', questionId: 'q1' })
    )
    await waitFor(() => expect(result.current.status).not.toBeNull())

    expect(result.current.canUseHint).toBe(true)
  })

  it('resets eliminated options when questionId changes', async () => {
    mockGet
      .mockResolvedValueOnce(successStatus({ eliminatedOptions: [1] }))
      .mockResolvedValueOnce(successStatus({ eliminatedOptions: [] }))

    const { result, rerender } = renderHook(
      ({ qid }: { qid: string }) =>
        useLifeline({ sessionId: 's1', questionId: qid }),
      { initialProps: { qid: 'q1' } }
    )

    await waitFor(() => expect(result.current.eliminatedOptions.has(1)).toBe(true))

    rerender({ qid: 'q2' })

    await waitFor(() => expect(result.current.eliminatedOptions.size).toBe(0))
    expect(mockGet).toHaveBeenLastCalledWith(
      '/api/sessions/s1/lifeline/status',
      { params: { questionId: 'q2' } }
    )
  })

  it('captures error from failed hint call without crashing', async () => {
    mockGet.mockResolvedValueOnce(successStatus())
    mockPost.mockRejectedValueOnce({
      response: { data: { error: 'Quota exhausted' } },
    })

    const { result } = renderHook(() =>
      useLifeline({ sessionId: 's1', questionId: 'q1' })
    )
    await waitFor(() => expect(result.current.status).not.toBeNull())

    let returned: any
    await act(async () => {
      returned = await result.current.useHint()
    })

    expect(returned).toBeNull()
    expect(result.current.error).toBe('Quota exhausted')
    expect(result.current.eliminatedOptions.size).toBe(0)
  })

  it('gracefully handles status fetch failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('network'))

    const { result } = renderHook(() =>
      useLifeline({ sessionId: 's1', questionId: 'q1' })
    )

    await waitFor(() => expect(mockGet).toHaveBeenCalled())
    // Hook should remain usable; status stays null, canUseHint false
    expect(result.current.status).toBeNull()
    expect(result.current.canUseHint).toBe(false)
  })

  it('no-ops useHint when sessionId is missing', async () => {
    const { result } = renderHook(() =>
      useLifeline({ sessionId: undefined, questionId: 'q1' })
    )

    const returned = await result.current.useHint()
    expect(returned).toBeNull()
    expect(mockPost).not.toHaveBeenCalled()
  })
})
