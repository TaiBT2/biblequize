/**
 * Haptic feedback. On web uses navigator.vibrate (no-ops where unsupported);
 * on the Capacitor target routes to native @capacitor/haptics for real taptic
 * engine feedback.
 */

import { isCapacitor } from '../platform/capacitor'
import { nativeImpact, nativeNotify } from '../platform/nativeHaptics'

const STORAGE_KEY = 'bq_haptics_enabled'

let _enabled = true
try {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved !== null) _enabled = saved === 'true'
} catch { /* use default */ }

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch { /* not supported */ }
}

// Fire web vibration or its native equivalent, honoring the enabled flag.
function fire(pattern: number | number[], native: () => void) {
  if (!_enabled) return
  if (isCapacitor()) native()
  else vibrate(pattern)
}

export const haptic = {
  correct: () => fire(50, () => nativeImpact('Medium')),
  wrong: () => fire([100, 50, 100], () => nativeNotify('Error')),
  select: () => fire(20, () => nativeImpact('Light')),
  combo: () => fire([50, 30, 50, 30, 50], () => nativeImpact('Medium')),
  tierUp: () => fire([100, 50, 100, 50, 200], () => nativeImpact('Heavy')),
  timerWarning: () => fire(30, () => nativeImpact('Light')),
  tap: () => fire(10, () => nativeImpact('Light')),
}

export function setHapticsEnabled(enabled: boolean) {
  _enabled = enabled
  try { localStorage.setItem(STORAGE_KEY, String(enabled)) } catch {}
}

export function isHapticsEnabled() { return _enabled }
