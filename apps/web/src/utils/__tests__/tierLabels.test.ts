import { describe, it, expect } from 'vitest'
import i18n from '../../i18n'
import { getTierLabel, getNextTierLabel } from '../tierLabels'

// Bind i18n.t to mimic the pattern components use (useTranslation().t)
const t = i18n.t.bind(i18n)

describe('getTierLabel', () => {
  it('maps tier 0 to Tân Tín Hữu in vi', async () => {
    await i18n.changeLanguage('vi')
    expect(getTierLabel(0, t)).toBe('Tân Tín Hữu')
  })

  it('maps tier 5 to Sứ Đồ in vi', async () => {
    await i18n.changeLanguage('vi')
    expect(getTierLabel(5, t)).toBe('Sứ Đồ')
  })

  it('returns English labels when language is en', async () => {
    await i18n.changeLanguage('en')
    expect(getTierLabel(0, t)).toBe('New Believer')
    expect(getTierLabel(3, t)).toBe('Sage')
    expect(getTierLabel(5, t)).toBe('Apostle')
    await i18n.changeLanguage('vi')
  })

  it('returns null for out-of-range tier levels', async () => {
    await i18n.changeLanguage('vi')
    expect(getTierLabel(-1, t)).toBeNull()
    expect(getTierLabel(6, t)).toBeNull()
    expect(getTierLabel(99, t)).toBeNull()
  })
})

describe('getNextTierLabel', () => {
  it('returns the next tier name for levels 1-5 in vi', async () => {
    await i18n.changeLanguage('vi')
    expect(getNextTierLabel(1, t)).toBe('Người Tìm Kiếm')
    expect(getNextTierLabel(2, t)).toBe('Môn Đồ')
    expect(getNextTierLabel(3, t)).toBe('Hiền Triết')
    expect(getNextTierLabel(4, t)).toBe('Tiên Tri')
    expect(getNextTierLabel(5, t)).toBe('Sứ Đồ')
  })

  it('returns null for tier 0 (next tier mapping starts at 1)', async () => {
    await i18n.changeLanguage('vi')
    expect(getNextTierLabel(0, t)).toBeNull()
  })

  it('returns null for tiers beyond 5', async () => {
    await i18n.changeLanguage('vi')
    expect(getNextTierLabel(6, t)).toBeNull()
    expect(getNextTierLabel(10, t)).toBeNull()
  })
})

describe('tier label count-interpolation edge cases (plural sanity)', () => {
  it('header.time.minutesAgo renders with count=0', () => {
    expect(t('header.time.minutesAgo', { count: 0 })).toBe('0 phút trước')
  })

  it('header.time.minutesAgo renders with count=1', () => {
    expect(t('header.time.minutesAgo', { count: 1 })).toBe('1 phút trước')
  })

  it('header.time.minutesAgo renders with count=59', () => {
    expect(t('header.time.minutesAgo', { count: 59 })).toBe('59 phút trước')
  })

  it('admin.groups.subtitle count=0 reads as "0 nhóm" in vi', async () => {
    await i18n.changeLanguage('vi')
    expect(t('admin.groups.subtitle', { count: 0 })).toBe('0 nhóm')
  })

  it('admin.groups.subtitle count=1 reads as "1 group" in en', async () => {
    await i18n.changeLanguage('en')
    expect(t('admin.groups.subtitle', { count: 1 })).toBe('1 groups')
    await i18n.changeLanguage('vi')
  })

  it('modals.comeback.awayDays count=1 does not duplicate day word', () => {
    expect(t('modals.comeback.awayDays', { count: 1 })).toBe('Bạn đã vắng 1 ngày. Nhận phần thưởng đặc biệt!')
  })

  it('room.quiz.questionProgress renders both {{current}} and {{total}}', () => {
    expect(t('room.quiz.questionProgress', { current: 3, total: 10 })).toBe('Câu 3/10')
  })
})
