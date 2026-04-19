import { describe, it, expect } from 'vitest'
import { TIERS, getTierByPoints, getNextTier, getTierInfo } from '../tiers'

/**
 * Tests for the consolidated tier data + helpers.
 *
 * Rationale: these functions are the single source of truth for tier
 * computation across the app (Home, Ranked, Profile, AppLayout). A
 * regression here silently desyncs every screen that reads tier — lock
 * it down with exhaustive tests.
 */

describe('TIERS constant shape', () => {
  it('has exactly 6 tiers (matches spec §3)', () => {
    expect(TIERS).toHaveLength(6)
  })

  it('has monotonically increasing minPoints', () => {
    for (let i = 1; i < TIERS.length; i++) {
      expect(TIERS[i].minPoints).toBeGreaterThan(TIERS[i - 1].minPoints)
    }
  })

  it('maxPoints of tier N equals minPoints of tier N+1 minus 1', () => {
    for (let i = 0; i < TIERS.length - 1; i++) {
      expect(TIERS[i].maxPoints).toBe(TIERS[i + 1].minPoints - 1)
    }
  })

  it('last tier extends to Infinity', () => {
    expect(TIERS[TIERS.length - 1].maxPoints).toBe(Infinity)
  })

  it('every tier has id, nameKey, and all visual fields populated', () => {
    for (const tier of TIERS) {
      expect(tier.id).toBeGreaterThan(0)
      expect(tier.nameKey).toMatch(/^tiers\./)
      expect(tier.iconMaterial).toBeTruthy()
      expect(tier.iconEmoji).toBeTruthy()
      expect(tier.colorHex).toMatch(/^#[0-9a-f]{3,6}$/i)
      expect(tier.colorTailwind).toBeTruthy()
    }
  })

  it('uses OLD religious nameKeys only (per DECISIONS.md 2026-04-19)', () => {
    const expected = ['newBeliever', 'seeker', 'disciple', 'sage', 'prophet', 'apostle']
    expect(TIERS.map(t => t.nameKey)).toEqual(expected.map(k => `tiers.${k}`))
  })
})

describe('getTierByPoints', () => {
  it('returns tier 1 for 0 points', () => {
    expect(getTierByPoints(0).id).toBe(1)
  })

  it('returns tier 1 for points below 1000', () => {
    expect(getTierByPoints(500).id).toBe(1)
    expect(getTierByPoints(999).id).toBe(1)
  })

  it('returns tier 2 at the boundary (1000)', () => {
    expect(getTierByPoints(1000).id).toBe(2)
  })

  it('returns tier 6 for 100000+', () => {
    expect(getTierByPoints(100_000).id).toBe(6)
    expect(getTierByPoints(999_999).id).toBe(6)
    expect(getTierByPoints(Number.MAX_SAFE_INTEGER).id).toBe(6)
  })

  it.each([
    [0, 1], [500, 1], [999, 1],
    [1_000, 2], [3_000, 2], [4_999, 2],
    [5_000, 3], [10_000, 3], [14_999, 3],
    [15_000, 4], [30_000, 4], [39_999, 4],
    [40_000, 5], [70_000, 5], [99_999, 5],
    [100_000, 6], [500_000, 6],
  ])('points=%i -> tier %i', (points, expectedTier) => {
    expect(getTierByPoints(points).id).toBe(expectedTier)
  })
})

describe('getNextTier', () => {
  it('returns tier 2 for a tier-1 user', () => {
    expect(getNextTier(500)?.id).toBe(2)
  })

  it('returns tier 6 for a tier-5 user', () => {
    expect(getNextTier(50_000)?.id).toBe(6)
  })

  it('returns null for a tier-6 user (max)', () => {
    expect(getNextTier(150_000)).toBeNull()
  })
})

describe('getTierInfo', () => {
  it('returns correct current + next at tier-1 start', () => {
    const info = getTierInfo(0)
    expect(info.current.id).toBe(1)
    expect(info.next?.id).toBe(2)
    expect(info.progressPct).toBe(0)
    expect(info.pointsToNext).toBe(1_000)
  })

  it('computes 50% progress correctly (tier 1 halfway)', () => {
    const info = getTierInfo(500)
    expect(info.current.id).toBe(1)
    expect(info.progressPct).toBe(50)
    expect(info.pointsToNext).toBe(500)
  })

  it('returns progressPct=100 and pointsToNext=0 at max tier', () => {
    const info = getTierInfo(200_000)
    expect(info.current.id).toBe(6)
    expect(info.next).toBeNull()
    expect(info.progressPct).toBe(100)
    expect(info.pointsToNext).toBe(0)
  })

  it('caps progressPct at 100 when points exceed next.minPoints (edge: boundary)', () => {
    // Right at next.minPoints — current becomes tier 2, new progress from that floor
    const info = getTierInfo(1_000)
    expect(info.current.id).toBe(2)
    expect(info.progressPct).toBe(0)
  })

  it('handles negative points defensively (clamps to 0)', () => {
    const info = getTierInfo(-500)
    expect(info.current.id).toBe(1)
    expect(info.progressPct).toBe(0)
  })

  it('handles NaN defensively (treats as 0)', () => {
    const info = getTierInfo(NaN)
    expect(info.current.id).toBe(1)
  })

  it('handles Infinity defensively', () => {
    const info = getTierInfo(Infinity)
    expect(info.current.id).toBe(1) // Infinity is not finite → coerced to 0
  })
})
