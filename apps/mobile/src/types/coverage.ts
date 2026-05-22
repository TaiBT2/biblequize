/**
 * Liturgical Coverage types (SPEC_USER_v3.2 §7.8.1).
 * Ported from web `apps/web/src/hooks/useCoverageStatus.ts` for mobile parity.
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
}
