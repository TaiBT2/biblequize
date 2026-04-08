/**
 * Haptic feedback for web (navigator.vibrate).
 * Gracefully no-ops on unsupported browsers.
 */

const STORAGE_KEY = 'bq_haptics_enabled'

let _enabled = true
try {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved !== null) _enabled = saved === 'true'
} catch { /* use default */ }

function vibrate(pattern: number | number[]) {
  if (!_enabled) return
  try {
    navigator.vibrate?.(pattern)
  } catch { /* not supported */ }
}

export const haptic = {
  correct: () => vibrate(50),
  wrong: () => vibrate([100, 50, 100]),
  select: () => vibrate(20),
  combo: () => vibrate([50, 30, 50, 30, 50]),
  tierUp: () => vibrate([100, 50, 100, 50, 200]),
  timerWarning: () => vibrate(30),
  tap: () => vibrate(10),
}

export function setHapticsEnabled(enabled: boolean) {
  _enabled = enabled
  try { localStorage.setItem(STORAGE_KEY, String(enabled)) } catch {}
}

export function isHapticsEnabled() { return _enabled }
