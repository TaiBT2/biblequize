import { getTierByPoints, getNextTier, getTierName } from '../data/tiers'
import { calculateTierProgress, pointsToNextTier } from './tierSystem'

describe('getTierByPoints', () => {
  test('0 points = Tân Tín Hữu', () => {
    expect(getTierByPoints(0).name).toBe('Tân Tín Hữu')
  })

  test('999 points = still Tân Tín Hữu', () => {
    expect(getTierByPoints(999).name).toBe('Tân Tín Hữu')
  })

  test('1000 points = Người Tìm Kiếm', () => {
    expect(getTierByPoints(1000).name).toBe('Người Tìm Kiếm')
  })

  test('5000 points = Môn Đồ', () => {
    expect(getTierByPoints(5000).name).toBe('Môn Đồ')
  })

  test('100000 points = Sứ Đồ (max)', () => {
    expect(getTierByPoints(100000).name).toBe('Sứ Đồ')
  })

  test('negative points = Tân Tín Hữu (fallback)', () => {
    expect(getTierByPoints(-10).name).toBe('Tân Tín Hữu')
  })
})

describe('getNextTier', () => {
  test('tier 1 → tier 2', () => {
    expect(getNextTier(500)?.name).toBe('Người Tìm Kiếm')
  })

  test('max tier → null', () => {
    expect(getNextTier(100000)).toBeNull()
  })
})

describe('getTierName', () => {
  test('returns tier name string', () => {
    expect(getTierName(0)).toBe('Tân Tín Hữu')
  })
})

describe('calculateTierProgress', () => {
  test('0 points = 0 progress', () => {
    expect(calculateTierProgress(0)).toBe(0)
  })

  test('halfway through tier 1 (500/1000)', () => {
    expect(calculateTierProgress(500)).toBeCloseTo(0.5)
  })

  test('at tier boundary = 0 progress in new tier', () => {
    expect(calculateTierProgress(1000)).toBeCloseTo(0)
  })

  test('max tier = 1', () => {
    expect(calculateTierProgress(100000)).toBe(1)
  })
})

describe('pointsToNextTier', () => {
  test('0 points → need 1000', () => {
    expect(pointsToNextTier(0)).toBe(1000)
  })

  test('999 points → need 1', () => {
    expect(pointsToNextTier(999)).toBe(1)
  })

  test('max tier → need 0', () => {
    expect(pointsToNextTier(100000)).toBe(0)
  })
})
