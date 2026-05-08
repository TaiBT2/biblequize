import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { formatRelativeTime } from '../dateFormat'
import i18n from '../../i18n'

describe('formatRelativeTime', () => {
  let originalLanguage: string

  beforeEach(() => {
    originalLanguage = i18n.language
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-09T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    if (originalLanguage) i18n.changeLanguage(originalLanguage)
  })

  it('returns empty string for null', () => {
    expect(formatRelativeTime(null)).toBe('')
  })

  it('returns empty string for undefined', () => {
    expect(formatRelativeTime(undefined)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(formatRelativeTime('')).toBe('')
  })

  it('returns empty string for invalid date string', () => {
    expect(formatRelativeTime('not-a-date')).toBe('')
  })

  it('returns empty string for invalid array input (LocalDateTime serialization regression)', () => {
    // Used to bug out as "NaN ngày trước" before BE Jackson fix.
    // Still guarded on FE for defense in depth.
    expect(formatRelativeTime([2026, 5, 9, 3, 40, 12] as unknown as string)).toBe('')
  })

  it('formats 5 minutes ago in vi locale', () => {
    i18n.changeLanguage('vi')
    const fiveMinAgo = new Date('2026-05-09T09:55:00Z').toISOString()
    const result = formatRelativeTime(fiveMinAgo)
    expect(result).toContain('5')
    expect(result).toMatch(/phút|minute/)
  })

  it('formats 5 minutes ago in en locale', () => {
    i18n.changeLanguage('en')
    const fiveMinAgo = new Date('2026-05-09T09:55:00Z').toISOString()
    const result = formatRelativeTime(fiveMinAgo)
    expect(result).toContain('5')
    expect(result.toLowerCase()).toContain('minute')
  })

  it('formats just-now (under 60s)', () => {
    const tenSecAgo = new Date('2026-05-09T09:59:50Z').toISOString()
    const result = formatRelativeTime(tenSecAgo)
    expect(result).toBeTruthy()
    expect(result).not.toContain('NaN')
  })

  it('formats hours-ago for 3 hours back', () => {
    const threeHoursAgo = new Date('2026-05-09T07:00:00Z').toISOString()
    const result = formatRelativeTime(threeHoursAgo)
    expect(result).toContain('3')
    expect(result).toMatch(/giờ|hour/)
  })

  it('formats days-ago for 5 days back', () => {
    // 2-day window may resolve to "hôm kia" with numeric:'auto';
    // 5 days is far enough to always use the numeric form.
    const fiveDaysAgo = new Date('2026-05-04T10:00:00Z').toISOString()
    const result = formatRelativeTime(fiveDaysAgo)
    expect(result).toContain('5')
    expect(result).toMatch(/ngày|day/)
  })

  it('formats Date objects directly', () => {
    const date = new Date('2026-05-09T09:55:00Z')
    const result = formatRelativeTime(date)
    expect(result).toBeTruthy()
    expect(result).not.toContain('NaN')
  })

  it('handles numeric epoch input', () => {
    const fiveMinAgo = Date.UTC(2026, 4, 9, 9, 55, 0)
    const result = formatRelativeTime(fiveMinAgo)
    expect(result).toBeTruthy()
    expect(result).not.toContain('NaN')
  })
})
