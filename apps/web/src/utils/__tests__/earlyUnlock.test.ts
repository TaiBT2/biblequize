import { describe, it, expect } from 'vitest'
import {
  minCorrectNeededForEarlyUnlock,
  practiceAccuracyPct,
  earlyUnlockProgressPct,
  EARLY_UNLOCK_MIN_QUESTIONS,
  EARLY_UNLOCK_MIN_ACCURACY_PCT,
} from '../earlyUnlock'

/**
 * Tests mirror the backend {@code EarlyRankedUnlockPolicyTest} to
 * guarantee both sides compute the same boundary. A drift between FE
 * hint and BE flag would confuse users ("UI says 'almost there' but
 * backend didn't unlock").
 */

describe('minCorrectNeededForEarlyUnlock', () => {
  it('is 0 when user already qualifies at exactly 80% on 10 questions', () => {
    expect(minCorrectNeededForEarlyUnlock(8, 10)).toBe(0)
  })

  it('is 0 when user over-qualifies (90%+)', () => {
    expect(minCorrectNeededForEarlyUnlock(9, 10)).toBe(0)
    expect(minCorrectNeededForEarlyUnlock(10, 10)).toBe(0)
  })

  it('handles brand-new user (0/0) — needs 10 correct in a row', () => {
    expect(minCorrectNeededForEarlyUnlock(0, 0)).toBe(10)
  })

  it('computes accuracy gap when user is above threshold questions but below 80%', () => {
    // 7/10 = 70%. To reach 80% must answer enough more correctly.
    // k = 4*10 − 5*7 = 40 − 35 = 5. So need 5 more correct.
    expect(minCorrectNeededForEarlyUnlock(7, 10)).toBe(5)
    // Verify math: (7+5)/(10+5) = 12/15 = 80% ✓
  })

  it('computes sample-size gap when user is accurate but has <10 answers', () => {
    // 3/3 = 100% but only 3 total. Need 7 more (all correct to stay ≥ 80%).
    expect(minCorrectNeededForEarlyUnlock(3, 3)).toBe(7)
  })

  it('takes the max of accuracy and sample-size constraints', () => {
    // 1/1 → accuracy=100%, samples=1. Need more questions.
    // accuracyGap = 4*1 - 5*1 = -1 (negative, not binding)
    // totalGap   = 10 - 1 = 9
    expect(minCorrectNeededForEarlyUnlock(1, 1)).toBe(9)
  })

  it('defensively clamps impossible inputs', () => {
    // Negative correct clamps to 0 → still need the full 10-question window.
    expect(minCorrectNeededForEarlyUnlock(-5, 0)).toBe(10)
    // correct > total is data corruption; safeTotal clamps up to safeCorrect
    // (5, 3) → (5, 5) internally. 5/5 satisfies 80%, but sample size is still
    // 5 short of the 10-question minimum → 5 more needed.
    expect(minCorrectNeededForEarlyUnlock(5, 3)).toBe(5)
  })

  it('handles large cumulative answers', () => {
    // 79/100 = 79% → need to push to 80%. k = 4*100 - 5*79 = 400 - 395 = 5.
    expect(minCorrectNeededForEarlyUnlock(79, 100)).toBe(5)
    // Verify: (79+5)/(100+5) = 84/105 = 80% ✓
  })

  it('matches backend threshold constants', () => {
    expect(EARLY_UNLOCK_MIN_QUESTIONS).toBe(10)
    expect(EARLY_UNLOCK_MIN_ACCURACY_PCT).toBe(80)
  })
})

describe('practiceAccuracyPct', () => {
  it('returns null when total is 0 (new user)', () => {
    expect(practiceAccuracyPct(0, 0)).toBeNull()
  })

  it('rounds to nearest integer', () => {
    expect(practiceAccuracyPct(7, 10)).toBe(70)
    expect(practiceAccuracyPct(1, 3)).toBe(33)
    expect(practiceAccuracyPct(2, 3)).toBe(67)
  })

  it('caps at 100% for perfect play', () => {
    expect(practiceAccuracyPct(10, 10)).toBe(100)
  })
})

describe('earlyUnlockProgressPct', () => {
  it('returns 100 when user already qualifies', () => {
    expect(earlyUnlockProgressPct(8, 10)).toBe(100)
    expect(earlyUnlockProgressPct(16, 20)).toBe(100)
  })

  it('never returns 100 when user does NOT qualify — reserves 100% for the win', () => {
    expect(earlyUnlockProgressPct(7, 10)).toBeLessThan(100)
    expect(earlyUnlockProgressPct(0, 0)).toBeLessThan(100)
  })

  it('grows monotonically as user approaches threshold', () => {
    const p0 = earlyUnlockProgressPct(0, 0)
    const p3 = earlyUnlockProgressPct(3, 3)
    const p7 = earlyUnlockProgressPct(7, 8)  // 87.5% on 8
    expect(p3).toBeGreaterThan(p0)
    expect(p7).toBeGreaterThan(p3)
  })
})
