import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export type BadgeTier = 'TOAN_THU' | 'TAN_TAM' | 'HANH_HUONG'

/**
 * Unawarded-but-earned season badge (§7.1.8). Present in coverage-status until
 * the BadgeAwardModal is shown and POST /api/me/badges/{id}/mark-shown is called.
 */
export interface UnshownBadge {
  id: string
  badgeTier: BadgeTier
  seasonId: string
  booksCovered: number
  totalQuestions: number
  accuracy: number
  daysActive: number
}

/**
 * Coverage status response shape — mirrors CoverageController GET /api/me/coverage-status.
 * Returns null when feature flag is off for this user (BE returns 404).
 */
export interface CoverageStatus {
  season: {
    id: string
    name: string
    startDate: string
    endDate: string
    daysRemaining: number
  }
  currentWeek: {
    weekNumber: number
    phase: 'FOUNDATION' | 'ACCELERATION' | 'CLIMAX' | 'MASTERY' | 'UNKNOWN'
    books: { code: string; covered: boolean; answeredCount: number }[]
    completed: boolean
    canUnlockNext: boolean
  }
  seasonProgress: {
    totalCovered: number
    weeksCompleted: number[]
    currentBadgePreview: string
  }
  /** §7.1.8 — set when the user has an earned season badge not yet shown. */
  unshownBadge: UnshownBadge | null
}

/**
 * Resolve current user's Liturgical Coverage state. Returns null if BE feature
 * flag off (404) so callers can branch to legacy CurrentBookCard cleanly.
 */
export function useCoverageStatus() {
  return useQuery<CoverageStatus | null>({
    queryKey: ['me-coverage-status'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/me/coverage-status')
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
