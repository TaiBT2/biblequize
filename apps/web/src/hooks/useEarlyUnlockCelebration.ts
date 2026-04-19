import { useEffect, useState } from 'react'

/**
 * Detects the "just unlocked Ranked early" event and signals the UI to
 * fire a celebration modal — exactly once per unlock.
 *
 * <p>Strategy:
 * <ul>
 *   <li>Backend sets {@code earlyRankedUnlockedAt} timestamp the first
 *       time the user hits the ≥80% / 10Q threshold.</li>
 *   <li>This hook compares that timestamp with a localStorage marker
 *       ({@link #STORAGE_KEY}). If the backend timestamp is newer (or
 *       the marker is missing), we're looking at a fresh unlock →
 *       {@code shouldCelebrate=true}.</li>
 *   <li>Caller invokes {@link #dismiss} after showing the modal; the
 *       marker is written to localStorage so the celebration doesn't
 *       fire again on subsequent renders or visits.</li>
 * </ul>
 *
 * <p>Per-user marker? We scope the marker by user email so a different
 * user logging in on the same browser sees their own celebration
 * (edge case, but cheap safeguard).
 */
const STORAGE_KEY_PREFIX = 'seenEarlyRankedUnlockAt:'

export interface UseEarlyUnlockCelebrationArgs {
  /** ISO string from backend, or null if user never unlocked early. */
  earlyRankedUnlockedAt: string | null | undefined
  /** User identifier (email or id) to scope the localStorage marker. */
  userKey: string | undefined
}

export function useEarlyUnlockCelebration({
  earlyRankedUnlockedAt,
  userKey,
}: UseEarlyUnlockCelebrationArgs) {
  const [shouldCelebrate, setShouldCelebrate] = useState(false)

  useEffect(() => {
    // Guard rails: no unlock yet, no user → nothing to celebrate.
    if (!earlyRankedUnlockedAt || !userKey) {
      setShouldCelebrate(false)
      return
    }

    try {
      const storageKey = STORAGE_KEY_PREFIX + userKey
      const lastSeen = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null

      // First time we've seen this unlock event → fire celebration.
      // Comparison as strings: ISO-8601 format compares lexicographically
      // in chronological order (1970 < 2026 as strings too).
      const isNew = !lastSeen || lastSeen < earlyRankedUnlockedAt
      setShouldCelebrate(isNew)
    } catch {
      // localStorage can throw in SSR / private-mode / quota-exceeded;
      // fail closed (do nothing) rather than spamming the modal.
      setShouldCelebrate(false)
    }
  }, [earlyRankedUnlockedAt, userKey])

  /** Mark the celebration as seen. Call this from the modal's onClose. */
  const dismiss = () => {
    setShouldCelebrate(false)
    if (!earlyRankedUnlockedAt || !userKey) return
    try {
      window.localStorage.setItem(STORAGE_KEY_PREFIX + userKey, earlyRankedUnlockedAt)
    } catch {
      // non-fatal — worst case the modal shows again next load
    }
  }

  return { shouldCelebrate, dismiss }
}
