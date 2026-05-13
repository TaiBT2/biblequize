import { useCallback, useEffect, useRef } from 'react'

/**
 * Debounced auto-save with manual flush + interval force-save.
 * - debounce(ms): waits idle ms before firing
 * - intervalMs: forced flush every N ms (default 30s per D4)
 * - flush(): force immediate save (e.g. on tab close, question switch)
 */
export function useAutoSave<T>(
  save: (payload: T) => void | Promise<void>,
  debounceMs = 2000,
  intervalMs = 30000,
) {
  const pendingRef = useRef<T | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveRef = useRef(save)
  useEffect(() => { saveRef.current = save }, [save])

  const flush = useCallback(async () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    const pending = pendingRef.current
    if (pending === null) return
    pendingRef.current = null
    await saveRef.current(pending)
  }, [])

  const schedule = useCallback((payload: T) => {
    pendingRef.current = payload
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      const p = pendingRef.current
      pendingRef.current = null
      if (p !== null) void saveRef.current(p)
    }, debounceMs)
  }, [debounceMs])

  // Force save on interval
  useEffect(() => {
    const id = setInterval(() => { if (pendingRef.current !== null) void flush() }, intervalMs)
    return () => clearInterval(id)
  }, [flush, intervalMs])

  // Save on tab close / page hide
  useEffect(() => {
    const onBeforeUnload = () => { if (pendingRef.current !== null) void flush() }
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('visibilitychange', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('visibilitychange', onBeforeUnload)
    }
  }, [flush])

  return { schedule, flush, hasPending: () => pendingRef.current !== null }
}
