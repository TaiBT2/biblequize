import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import RankedStandardCard from '../RankedStandardCard'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => (key === 'gameModes.ranked' ? 'Đấu Hạng' : key),
  }),
}))

describe('RankedStandardCard (HR-5)', () => {
  it('renders C2-compliant title and pill', () => {
    render(
      <RankedStandardCard
        energyRemaining={100}
        rankedAnswered={0}
        rankedCap={100}
        onEnter={() => {}}
      />
    )
    expect(screen.getByTestId('ranked-standard-card-title')).toHaveTextContent('Đấu Hạng')
    expect(screen.getByTestId('ranked-standard-card-pill')).toHaveTextContent('Đã mở khóa')
  })

  it('shows energy hint inside the description', () => {
    render(
      <RankedStandardCard
        energyRemaining={73}
        rankedAnswered={0}
        rankedCap={100}
        onEnter={() => {}}
      />
    )
    expect(screen.getByTestId('ranked-standard-card-desc')).toHaveTextContent(
      '73 năng lượng sẵn sàng'
    )
  })

  it('shows daily cap progress in footer', () => {
    render(
      <RankedStandardCard
        energyRemaining={100}
        rankedAnswered={42}
        rankedCap={100}
        onEnter={() => {}}
      />
    )
    expect(screen.getByTestId('ranked-standard-card-hint')).toHaveTextContent('42 / 100')
  })

  it('fires onEnter when card is clicked', async () => {
    const onEnter = vi.fn()
    const user = userEvent.setup()
    render(
      <RankedStandardCard
        energyRemaining={100}
        rankedAnswered={0}
        rankedCap={100}
        onEnter={onEnter}
      />
    )
    await user.click(screen.getByTestId('ranked-standard-card-title'))
    expect(onEnter).toHaveBeenCalledTimes(1)
  })

  it('uses gold-tint background (not the full hero gold gradient)', () => {
    render(
      <RankedStandardCard
        energyRemaining={100}
        rankedAnswered={0}
        rankedCap={100}
        onEnter={() => {}}
      />
    )
    const card = screen.getByTestId('ranked-standard-card')
    const styleAttr = card.getAttribute('style') ?? ''
    // Must NOT contain the full hero recipe (#7a5818 = hero gold-shadow stop).
    expect(styleAttr).not.toContain('#7a5818')
    // Must use the low-alpha gold tint pattern from the mockup.
    expect(styleAttr).toContain('rgba(232,168,50,0.06)')
  })
})
