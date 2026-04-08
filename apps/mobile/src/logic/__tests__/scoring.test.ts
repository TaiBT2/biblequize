import { calculateScore, ScoreInput } from '../scoring'

const base = (overrides: Partial<ScoreInput> = {}): ScoreInput => ({
  difficulty: 'medium',
  isCorrect: true,
  elapsedMs: 30000,
  timeLimitMs: 30000,
  comboCount: 0,
  tierMultiplier: 1.0,
  ...overrides,
})

describe('calculateScore', () => {
  it('returns 0 for wrong answer', () => {
    expect(calculateScore(base({ isCorrect: false }))).toBe(0)
  })

  it('returns base score for correct at time limit', () => {
    expect(calculateScore(base({ difficulty: 'easy' }))).toBe(8)
    expect(calculateScore(base({ difficulty: 'medium' }))).toBe(12)
    expect(calculateScore(base({ difficulty: 'hard' }))).toBe(18)
  })

  it('adds speed bonus for fast answers', () => {
    const slow = calculateScore(base({ elapsedMs: 30000 }))
    const fast = calculateScore(base({ elapsedMs: 5000 }))
    expect(fast).toBeGreaterThan(slow)
  })

  it('applies 1.2x combo at 5+ streak', () => {
    const noCombo = calculateScore(base({ comboCount: 0 }))
    const combo5 = calculateScore(base({ comboCount: 5 }))
    expect(combo5).toBe(Math.floor(noCombo * 1.2))
  })

  it('applies 1.5x combo at 10+ streak', () => {
    const noCombo = calculateScore(base({ comboCount: 0 }))
    const combo10 = calculateScore(base({ comboCount: 10 }))
    expect(combo10).toBe(Math.floor(noCombo * 1.5))
  })

  it('applies tier multiplier', () => {
    const t1 = calculateScore(base({ tierMultiplier: 1.0 }))
    const t3 = calculateScore(base({ tierMultiplier: 1.2 }))
    expect(t3).toBeGreaterThan(t1)
  })

  it('speed bonus is quadratic', () => {
    // At 50% time remaining, bonus = base * 0.5 * 0.5^2 = base * 0.125
    const score = calculateScore(base({ elapsedMs: 15000 })) // 50% remaining
    // base 12 + speed floor(12*0.5*0.25) = 12 + 1 = 13
    expect(score).toBe(13)
  })

  it('instant answer gets max speed bonus', () => {
    const score = calculateScore(base({ elapsedMs: 0 }))
    // base 12 + speed floor(12*0.5*1) = 12 + 6 = 18
    expect(score).toBe(18)
  })

  it('applies daily first-question 2x bonus', () => {
    const normal = calculateScore(base())
    const daily = calculateScore(base({ isDailyFirst: true }))
    expect(daily).toBe(normal * 2)
  })

  it('does not apply daily bonus when false', () => {
    const a = calculateScore(base())
    const b = calculateScore(base({ isDailyFirst: false }))
    expect(a).toBe(b)
  })
})
