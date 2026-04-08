import { getTierByPoints, getTierProgress, getStarInfo, TIERS } from '../tierProgression'

describe('getTierByPoints', () => {
  it('returns tier 1 for 0 points', () => {
    expect(getTierByPoints(0).level).toBe(1)
  })

  it('returns tier 2 at 1000 points', () => {
    expect(getTierByPoints(1000).level).toBe(2)
  })

  it('returns tier 6 at 100000 points', () => {
    expect(getTierByPoints(100000).level).toBe(6)
  })

  it('returns tier 1 for 999 points', () => {
    expect(getTierByPoints(999).level).toBe(1)
  })

  it('returns tier 5 at 40000', () => {
    expect(getTierByPoints(40000).level).toBe(5)
  })
})

describe('getTierProgress', () => {
  it('returns 0% at tier start', () => {
    const p = getTierProgress(0)
    expect(p.percent).toBe(0)
    expect(p.next?.level).toBe(2)
  })

  it('returns 50% at midpoint', () => {
    const p = getTierProgress(500)
    expect(p.percent).toBe(50)
  })

  it('returns 100% for max tier', () => {
    const p = getTierProgress(100000)
    expect(p.percent).toBe(100)
    expect(p.next).toBeNull()
  })

  it('computes pointsToNext correctly', () => {
    const p = getTierProgress(800)
    expect(p.pointsToNext).toBe(200)
  })
})

describe('getStarInfo', () => {
  it('tier 1 star 0 at 0 points', () => {
    const s = getStarInfo(0)
    expect(s.starIndex).toBe(0)
    expect(s.progress).toBe(0)
  })

  it('tier 1 star 1 at 200 points', () => {
    const s = getStarInfo(200)
    expect(s.starIndex).toBe(1)
  })

  it('tier 6 returns max', () => {
    const s = getStarInfo(100000)
    expect(s.starIndex).toBe(0)
    expect(s.progress).toBe(100)
  })
})

describe('TIERS', () => {
  it('has 6 tiers', () => {
    expect(TIERS).toHaveLength(6)
  })

  it('tiers are sorted by minPoints', () => {
    for (let i = 1; i < TIERS.length; i++) {
      expect(TIERS[i].minPoints).toBeGreaterThan(TIERS[i - 1].minPoints)
    }
  })
})
