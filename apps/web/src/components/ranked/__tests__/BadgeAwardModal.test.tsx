import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, opts?: Record<string, unknown>) => (opts ? `${k}:${JSON.stringify(opts)}` : k),
  }),
}))

import BadgeAwardModal from '../BadgeAwardModal'
import type { UnshownBadge } from '../../../hooks/useCoverageStatus'

const baseBadge: UnshownBadge = {
  id: 'badge-1',
  badgeTier: 'TOAN_THU',
  seasonId: 'season-2026-q1',
  booksCovered: 66,
  totalQuestions: 1247,
  accuracy: 82,
  daysActive: 87,
}

describe('BadgeAwardModal', () => {
  it('renders tier name + verse + 4-stat grid', () => {
    render(<BadgeAwardModal isOpen onClose={() => {}} badge={baseBadge} />)
    expect(screen.getByText('ranked.badge_award.tier_name.TOAN_THU')).toBeInTheDocument()
    expect(screen.getByText('ranked.badge_award.verses.TOAN_THU')).toBeInTheDocument()
    expect(screen.getByText('66')).toBeInTheDocument()
    expect(screen.getByText('1,247')).toBeInTheDocument()
    expect(screen.getByText('82%')).toBeInTheDocument()
    expect(screen.getByText('87')).toBeInTheDocument()
  })

  it('derives season name from seasonId quarter (q1 → EASTER 2026)', () => {
    render(<BadgeAwardModal isOpen onClose={() => {}} badge={baseBadge} />)
    expect(
      screen.getByText('ranked.badge_award.season_name.EASTER:{"year":"2026"}')
    ).toBeInTheDocument()
  })

  it('maps q3 seasonId → THANKSGIVING', () => {
    render(
      <BadgeAwardModal isOpen onClose={() => {}}
        badge={{ ...baseBadge, seasonId: 'season-2027-q3' }} />
    )
    expect(
      screen.getByText('ranked.badge_award.season_name.THANKSGIVING:{"year":"2027"}')
    ).toBeInTheDocument()
  })

  it('renders each tier (TAN_TAM, HANH_HUONG)', () => {
    const { rerender } = render(
      <BadgeAwardModal isOpen onClose={() => {}}
        badge={{ ...baseBadge, badgeTier: 'TAN_TAM' }} />
    )
    expect(screen.getByText('ranked.badge_award.tier_name.TAN_TAM')).toBeInTheDocument()
    rerender(
      <BadgeAwardModal isOpen onClose={() => {}}
        badge={{ ...baseBadge, badgeTier: 'HANH_HUONG' }} />
    )
    expect(screen.getByText('ranked.badge_award.tier_name.HANH_HUONG')).toBeInTheDocument()
  })

  it('close button calls onClose', () => {
    const onClose = vi.fn()
    render(<BadgeAwardModal isOpen onClose={onClose} badge={baseBadge} />)
    fireEvent.click(screen.getByText('ranked.badge_award.close_cta'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('share button shown only when onShare provided', () => {
    const { rerender } = render(
      <BadgeAwardModal isOpen onClose={() => {}} badge={baseBadge} />
    )
    expect(screen.queryByText('ranked.badge_award.share_cta')).not.toBeInTheDocument()
    rerender(
      <BadgeAwardModal isOpen onClose={() => {}} badge={baseBadge} onShare={() => {}} />
    )
    expect(screen.getByText('ranked.badge_award.share_cta')).toBeInTheDocument()
  })
})
