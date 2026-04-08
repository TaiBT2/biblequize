import { shouldResetStreak, isStreakActive, canUseStreakFreeze } from '../streaks'

describe('shouldResetStreak', () => {
  it('returns false if no last played date', () => {
    expect(shouldResetStreak(null, '2026-04-08')).toBe(false)
  })

  it('returns false if played yesterday', () => {
    expect(shouldResetStreak('2026-04-07', '2026-04-08')).toBe(false)
  })

  it('returns true if skipped a day', () => {
    expect(shouldResetStreak('2026-04-06', '2026-04-08')).toBe(true)
  })

  it('returns true if 3+ days gap', () => {
    expect(shouldResetStreak('2026-04-01', '2026-04-08')).toBe(true)
  })
})

describe('isStreakActive', () => {
  it('returns true for same day', () => {
    expect(isStreakActive('2026-04-08', '2026-04-08')).toBe(true)
  })

  it('returns true for yesterday', () => {
    expect(isStreakActive('2026-04-07', '2026-04-08')).toBe(true)
  })

  it('returns false for 2+ days', () => {
    expect(isStreakActive('2026-04-06', '2026-04-08')).toBe(false)
  })
})

describe('canUseStreakFreeze', () => {
  it('returns true if not used', () => {
    expect(canUseStreakFreeze(false)).toBe(true)
  })

  it('returns false if already used', () => {
    expect(canUseStreakFreeze(true)).toBe(false)
  })
})
