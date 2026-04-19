import { describe, it, expect } from 'vitest'
import {
  getRecommendedMode,
  THRESHOLDS,
  type RecommendationContext,
} from '../getRecommendedMode'

/**
 * Tests for {@link getRecommendedMode}.
 *
 * Covers each of the 5 priority branches plus defensive edge cases.
 * The cascade semantics — later rules NEVER fire when an earlier one
 * matches — are asserted explicitly in a dedicated block.
 */

function ctx(overrides: Partial<RecommendationContext>): RecommendationContext {
  return {
    totalPoints: 1000,
    currentStreak: 0,
    energy: 50,
    energyMax: 100,
    dailyDone: true,
    hoursToMidnight: 14,
    ...overrides,
  }
}

describe('getRecommendedMode', () => {
  describe('null/invalid input', () => {
    it('returns null when context is null', () => {
      expect(getRecommendedMode(null)).toBeNull()
    })

    it('returns null when context is undefined', () => {
      expect(getRecommendedMode(undefined)).toBeNull()
    })

    it('tolerates NaN/Infinity numbers by using safe defaults', () => {
      const rec = getRecommendedMode({
        totalPoints: NaN as any,
        currentStreak: Infinity as any,
        energy: -5,
        energyMax: 0,
        dailyDone: false,
        hoursToMidnight: NaN as any,
      })
      // totalPoints coerced to 0 → onboarding rule fires
      expect(rec).not.toBeNull()
      expect(rec?.reasonKey).toBe('onboarding')
    })
  })

  describe('P1 — streakAboutToBreak (loss aversion)', () => {
    it('fires when streak ≥ 3, daily undone, and < 6h to midnight', () => {
      const rec = getRecommendedMode(ctx({
        currentStreak: 15,
        dailyDone: false,
        hoursToMidnight: 3,
      }))
      expect(rec).toEqual({
        mode: 'daily',
        reasonKey: 'streakAboutToBreak',
        values: { streak: 15, hours: 3 },
      })
    })

    it('does NOT fire if streak < 3 (not enough invested to protect)', () => {
      const rec = getRecommendedMode(ctx({
        currentStreak: 2,
        dailyDone: false,
        hoursToMidnight: 3,
      }))
      // Falls through to dailyAvailable (P3) since daily still undone
      expect(rec?.reasonKey).toBe('dailyAvailable')
    })

    it('does NOT fire if daily already done', () => {
      const rec = getRecommendedMode(ctx({
        currentStreak: 15,
        dailyDone: true,
        hoursToMidnight: 3,
      }))
      expect(rec?.reasonKey).not.toBe('streakAboutToBreak')
    })

    it('does NOT fire if > 6h remaining (not urgent yet)', () => {
      const rec = getRecommendedMode(ctx({
        currentStreak: 15,
        dailyDone: false,
        hoursToMidnight: 10,
      }))
      expect(rec?.reasonKey).toBe('dailyAvailable')
    })

    it('rounds fractional hours up so display never shows "0h left"', () => {
      const rec = getRecommendedMode(ctx({
        currentStreak: 5,
        dailyDone: false,
        hoursToMidnight: 0.2,
      }))
      expect(rec?.values.hours).toBe(1)
    })
  })

  describe('P2 — onboarding (brand-new user)', () => {
    it('fires when totalPoints = 0', () => {
      const rec = getRecommendedMode(ctx({
        totalPoints: 0,
        currentStreak: 0,
        dailyDone: false,
        hoursToMidnight: 14,
      }))
      expect(rec?.mode).toBe('practice')
      expect(rec?.reasonKey).toBe('onboarding')
    })

    it('does NOT fire once the user has any XP', () => {
      const rec = getRecommendedMode(ctx({
        totalPoints: 10,
        dailyDone: true,
      }))
      expect(rec?.reasonKey).not.toBe('onboarding')
    })
  })

  describe('P3 — dailyAvailable (opportunity nudge)', () => {
    it('fires when daily undone and < 12h to midnight', () => {
      const rec = getRecommendedMode(ctx({
        totalPoints: 500,
        currentStreak: 1,
        dailyDone: false,
        hoursToMidnight: 8,
      }))
      expect(rec?.mode).toBe('daily')
      expect(rec?.reasonKey).toBe('dailyAvailable')
    })

    it('does NOT fire in the morning when plenty of time remains', () => {
      const rec = getRecommendedMode(ctx({
        totalPoints: 500,
        dailyDone: false,
        hoursToMidnight: 20,
        energy: 50, // not full, so won't trigger fullEnergy either
      }))
      expect(rec?.reasonKey).toBe('default')
    })
  })

  describe('P4 — fullEnergy (efficiency)', () => {
    it('fires when energy ≥ 90% of max', () => {
      const rec = getRecommendedMode(ctx({
        totalPoints: 1000,
        dailyDone: true,
        energy: 95,
        energyMax: 100,
        hoursToMidnight: 14,
      }))
      expect(rec?.mode).toBe('ranked')
      expect(rec?.reasonKey).toBe('fullEnergy')
      expect(rec?.values).toEqual({ energy: 95, max: 100 })
    })

    it('fires at exactly the 90% threshold (inclusive)', () => {
      const rec = getRecommendedMode(ctx({
        totalPoints: 1000,
        dailyDone: true,
        energy: 90,
        energyMax: 100,
      }))
      expect(rec?.reasonKey).toBe('fullEnergy')
    })

    it('does NOT fire at 89%', () => {
      const rec = getRecommendedMode(ctx({
        totalPoints: 1000,
        dailyDone: true,
        energy: 89,
        energyMax: 100,
      }))
      expect(rec?.reasonKey).toBe('default')
    })

    it('scales with custom energyMax', () => {
      const rec = getRecommendedMode(ctx({
        totalPoints: 1000,
        dailyDone: true,
        energy: 180,
        energyMax: 200,
      }))
      expect(rec?.reasonKey).toBe('fullEnergy')
    })
  })

  describe('P5 — default fallback', () => {
    it('returns ranked/default when no special signal', () => {
      const rec = getRecommendedMode(ctx({
        totalPoints: 1000,
        currentStreak: 0,
        dailyDone: true,
        energy: 50,
        hoursToMidnight: 14,
      }))
      expect(rec).toEqual({ mode: 'ranked', reasonKey: 'default', values: {} })
    })
  })

  describe('priority cascade — earlier rule wins when multiple would fire', () => {
    it('streak protection beats daily opportunity', () => {
      // Both P1 and P3 conditions hold → P1 wins
      const rec = getRecommendedMode(ctx({
        currentStreak: 10,
        dailyDone: false,
        hoursToMidnight: 3,
      }))
      expect(rec?.reasonKey).toBe('streakAboutToBreak')
    })

    it('onboarding beats fullEnergy even when energy full', () => {
      // New user with maxed energy → still teach practice first
      const rec = getRecommendedMode(ctx({
        totalPoints: 0,
        energy: 100,
        energyMax: 100,
        dailyDone: true,
      }))
      expect(rec?.reasonKey).toBe('onboarding')
    })

    it('dailyAvailable beats fullEnergy when both match', () => {
      const rec = getRecommendedMode(ctx({
        totalPoints: 500,
        dailyDone: false,
        energy: 100,
        energyMax: 100,
        hoursToMidnight: 8,
      }))
      expect(rec?.reasonKey).toBe('dailyAvailable')
    })
  })

  describe('thresholds are exported for UI/display use', () => {
    it('matches internal rule constants', () => {
      expect(THRESHOLDS.STREAK_URGENT_HOURS).toBe(6)
      expect(THRESHOLDS.DAILY_OPPORTUNITY_HOURS).toBe(12)
      expect(THRESHOLDS.STREAK_PROTECT_MIN).toBe(3)
      expect(THRESHOLDS.ENERGY_FULL_RATIO).toBe(0.9)
    })
  })

  /**
   * Tier-gating via {@code unlockedModes} — a rule whose target mode
   * isn't in the set must fall through to the next rule. Regression
   * guard: Tier-1 users must NEVER receive a 'ranked' recommendation
   * even in scenarios where the engine would otherwise pick it.
   */
  describe('tier gating via unlockedModes', () => {
    it('falls back to Practice when default rule would pick locked Ranked', () => {
      // Tier-1 user: ranked is locked. No special signal → default rule
      // normally picks ranked → should fall back to practice.
      const rec = getRecommendedMode(ctx({
        totalPoints: 500,
        dailyDone: true,
        energy: 50,
        unlockedModes: new Set(['practice', 'daily']),
      }))
      expect(rec?.mode).toBe('practice')
      expect(rec?.reasonKey).toBe('default')
    })

    it('skips fullEnergy rule when Ranked is locked', () => {
      // Energy full → normally fires fullEnergy on ranked. With ranked
      // locked → falls through to default → practice.
      const rec = getRecommendedMode(ctx({
        totalPoints: 500,
        dailyDone: true,
        energy: 100,
        energyMax: 100,
        unlockedModes: new Set(['practice', 'daily']),
      }))
      expect(rec?.mode).toBe('practice')
    })

    it('still recommends Ranked when mode is unlocked', () => {
      const rec = getRecommendedMode(ctx({
        totalPoints: 2000,
        dailyDone: true,
        energy: 95,
        energyMax: 100,
        unlockedModes: new Set(['practice', 'daily', 'ranked']),
      }))
      expect(rec?.mode).toBe('ranked')
      expect(rec?.reasonKey).toBe('fullEnergy')
    })

    it('omitting unlockedModes treats everything as unlocked (legacy behaviour)', () => {
      const rec = getRecommendedMode(ctx({
        totalPoints: 500,
        dailyDone: true,
        energy: 50,
      }))
      expect(rec?.mode).toBe('ranked')
      expect(rec?.reasonKey).toBe('default')
    })

    it('respects onboarding rule when Practice is unlocked', () => {
      const rec = getRecommendedMode(ctx({
        totalPoints: 0,
        unlockedModes: new Set(['practice', 'daily']),
      }))
      expect(rec?.reasonKey).toBe('onboarding')
      expect(rec?.mode).toBe('practice')
    })
  })
})
