import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'

/**
 * Response shape from the backend lifeline endpoints (mirrors Java DTOs).
 */
export interface HintResponse {
  eliminatedOptionIndex: number
  hintsRemaining: number           // -1 = unlimited
  method: 'COMMUNITY_INFORMED' | 'RANDOM'
}

export interface LifelineStatusResponse {
  hintsRemaining: number           // -1 = unlimited
  hintQuota: number                // -1 = unlimited, 0 = disabled
  eliminatedOptions: number[]
  mode: string
  askOpinionAvailable: boolean     // always false in v1
}

export interface UseLifelineResult {
  /** Hints left in this session. {@code -1} means unlimited. */
  hintsRemaining: number
  /** Indices already eliminated for the current question (reset on questionId change). */
  eliminatedOptions: Set<number>
  /** True while a hint mutation is in flight. */
  isHintLoading: boolean
  /** Last-seen status from the server (raw). */
  status: LifelineStatusResponse | null
  /** True if the user CAN press the hint button right now. */
  canUseHint: boolean
  /** Invoke the HINT lifeline. Resolves with the eliminated index on success. */
  useHint: () => Promise<HintResponse | null>
  /** Re-fetch status from the server (e.g. after navigation). */
  refresh: () => Promise<void>
  /** Last error message from a failed hint call, if any. */
  error: string | null
}

interface UseLifelineOptions {
  sessionId: string | undefined
  questionId: string | undefined
  /**
   * When false, the hook is inert — no API calls, {@code canUseHint} is
   * always false. Useful when a session is not yet ready or when the
   * current screen doesn't support lifelines.
   */
  enabled?: boolean
}

/**
 * React hook that wraps the lifeline API for a quiz session.
 *
 * <p>Responsibilities:
 * <ol>
 *   <li>On mount / {@code questionId} change — fetch the current lifeline
 *       status (remaining quota + already-eliminated options for the current
 *       question).</li>
 *   <li>Expose {@code useHint()} which POSTs to the hint endpoint and
 *       merges the returned eliminated index into local state.</li>
 *   <li>Reset the eliminated-options set when {@code questionId} changes
 *       (each question starts with a clean slate).</li>
 * </ol>
 *
 * <p>Uses plain fetch via {@code api} (axios). TanStack Query is not used
 * here because the state is (a) write-heavy with optimistic updates and
 * (b) scoped to a single component instance that already owns the
 * question lifecycle — keeping it local avoids cache-invalidation
 * complexity.
 */
export function useLifeline(options: UseLifelineOptions): UseLifelineResult {
  const { sessionId, questionId, enabled = true } = options

  const [status, setStatus] = useState<LifelineStatusResponse | null>(null)
  const [eliminatedOptions, setEliminatedOptions] = useState<Set<number>>(new Set())
  const [isHintLoading, setIsHintLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Guard against setting state after the component unmounts — the hint
  // endpoint is a short POST but the status fetch can race with rapid
  // question-switches.
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const fetchStatus = useCallback(async () => {
    if (!enabled || !sessionId) return
    try {
      const params = questionId ? { questionId } : {}
      const res = await api.get<LifelineStatusResponse>(
        `/api/sessions/${sessionId}/lifeline/status`,
        { params }
      )
      if (!mountedRef.current) return
      setStatus(res.data)
      setEliminatedOptions(new Set(res.data.eliminatedOptions ?? []))
      setError(null)
    } catch (e: any) {
      if (!mountedRef.current) return
      // Non-fatal: if status fails, fall back to "no lifelines available"
      // rather than crashing the quiz.
      const msg = e?.response?.data?.error || e?.message || 'Failed to load lifeline status'
      console.warn('[useLifeline] status fetch failed:', msg)
      setStatus(null)
      setEliminatedOptions(new Set())
    }
  }, [enabled, sessionId, questionId])

  // Fetch status on mount and whenever session or question changes.
  useEffect(() => {
    if (!enabled) return
    // Reset eliminated set eagerly so the UI doesn't flash stale "X"
    // overlays while the new status loads.
    setEliminatedOptions(new Set())
    fetchStatus()
  }, [enabled, sessionId, questionId, fetchStatus])

  const useHint = useCallback(async (): Promise<HintResponse | null> => {
    if (!enabled || !sessionId || !questionId) return null
    if (isHintLoading) return null

    setIsHintLoading(true)
    setError(null)
    try {
      const res = await api.post<HintResponse>(
        `/api/sessions/${sessionId}/lifeline/hint`,
        { questionId }
      )
      if (!mountedRef.current) return res.data

      // Merge the newly-eliminated index into local state.
      setEliminatedOptions(prev => {
        const next = new Set(prev)
        next.add(res.data.eliminatedOptionIndex)
        return next
      })

      // Optimistically update hintsRemaining based on server response.
      setStatus(prev => prev
        ? { ...prev, hintsRemaining: res.data.hintsRemaining }
        : prev)

      return res.data
    } catch (e: any) {
      if (!mountedRef.current) return null
      const msg = e?.response?.data?.error || e?.message || 'Hint failed'
      setError(msg)
      console.warn('[useLifeline] hint failed:', msg)
      return null
    } finally {
      if (mountedRef.current) setIsHintLoading(false)
    }
  }, [enabled, sessionId, questionId, isHintLoading])

  const hintsRemaining = status?.hintsRemaining ?? 0

  // canUseHint requires:
  //   - hook enabled
  //   - session + question both present
  //   - status loaded
  //   - quota not zero (disabled mode)
  //   - remaining > 0 OR unlimited (-1)
  //   - not currently in-flight
  const canUseHint =
    enabled &&
    !!sessionId &&
    !!questionId &&
    !!status &&
    status.hintQuota !== 0 &&
    (hintsRemaining > 0 || hintsRemaining === -1) &&
    !isHintLoading

  return {
    hintsRemaining,
    eliminatedOptions,
    isHintLoading,
    status,
    canUseHint,
    useHint,
    refresh: fetchStatus,
    error,
  }
}
