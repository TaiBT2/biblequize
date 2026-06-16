import { describe, it, expect, vi, afterEach } from 'vitest'
import { handleSessionExpiry } from '../sessionExpiry'
import { useAuthStore } from '../../store/authStore'

/**
 * Regression for the prod incident where 'auth:session-expired' re-entered
 * logout() in an infinite loop (logout → /api/ranked/sync-progress 401 →
 * refresh 401 → re-dispatch session-expired → logout → ...), burning the
 * rate limit until login broke with `processing_failed`.
 */
describe('handleSessionExpiry — re-entrancy guard', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('runs logout only once when re-entered while in flight', async () => {
    let resolveLogout!: () => void
    const logout = vi.fn(() => new Promise<void>((r) => { resolveLogout = r }))
    vi.spyOn(useAuthStore, 'getState').mockReturnValue({ logout } as any)

    // First event starts logout (handlingExpiry=true). A second event
    // dispatched before logout settles must be ignored.
    const first = handleSessionExpiry()
    const second = handleSessionExpiry()

    resolveLogout()
    await Promise.all([first, second])

    expect(logout).toHaveBeenCalledTimes(1)
  })

  it('handles a fresh expiry after the previous one has settled', async () => {
    const logout = vi.fn(() => Promise.resolve())
    vi.spyOn(useAuthStore, 'getState').mockReturnValue({ logout } as any)

    await handleSessionExpiry()
    await handleSessionExpiry()

    expect(logout).toHaveBeenCalledTimes(2)
  })
})
