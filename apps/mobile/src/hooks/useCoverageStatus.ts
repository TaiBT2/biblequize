import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import type { CoverageStatus } from '../types/coverage'

/**
 * Fetch the current user's Liturgical Coverage state (SPEC_USER_v3.2 §7.8.1).
 *
 * Mirrors web `apps/web/src/hooks/useCoverageStatus.ts`. Returns null when the
 * BE feature flag is off for this user (404) so callers branch cleanly —
 * mobile users outside the rollout simply render no coverage UI.
 */
export function useCoverageStatus() {
  return useQuery<CoverageStatus | null>({
    queryKey: ['me-coverage-status'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/api/me/coverage-status')
        return res.data as CoverageStatus
      } catch (err) {
        const e = err as { response?: { status?: number } }
        if (e?.response?.status === 404) return null
        throw err
      }
    },
    staleTime: 60_000,
  })
}
