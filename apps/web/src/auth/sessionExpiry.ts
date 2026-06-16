import { useAuthStore } from '../store/authStore'

// Paths where an expired session is expected/harmless — don't bounce the user
// to /login from these (guest-accessible pages).
const PUBLIC_PATHS = ['/', '/login', '/auth/callback', '/practice', '/leaderboard']

// Re-entrancy guard. `logout()` itself makes authenticated calls (e.g.
// /api/ranked/sync-progress) that can 401 → the api-client interceptor tries
// /api/auth/refresh → that 401s too → it re-dispatches 'auth:session-expired'
// WHILE this handler's logout() is still in flight. Without a guard that is an
// infinite request loop (sync-progress → refresh → logout → repeat) which
// hammers the server and burns the rate limit until the user is locked out.
// Ignore re-entrant events until the in-flight logout settles.
let handlingExpiry = false

/** Exported for testing. Handles a single 'auth:session-expired' event. */
export async function handleSessionExpiry(): Promise<void> {
  if (handlingExpiry) return
  handlingExpiry = true
  try {
    await useAuthStore.getState().logout()
    if (!PUBLIC_PATHS.includes(window.location.pathname)) {
      window.location.href = '/login'
    }
  } finally {
    handlingExpiry = false
  }
}

/** Install the global session-expiry listener (called once at app startup). */
export function installSessionExpiryHandler(): void {
  window.addEventListener('auth:session-expired', () => {
    void handleSessionExpiry()
  })
}
