import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import RankedStandardCard from '../RankedStandardCard'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const dict: Record<string, string> = {
        'gameModes.ranked': 'Đấu Hạng',
        'home.rankedStandard.pillUnlocked': 'Đã mở khóa',
        'home.rankedStandard.desc': 'Cạnh tranh ranking · {{energy}} năng lượng sẵn sàng',
        'home.rankedStandard.cta': 'Vào trận',
        'home.rankedStandard.dailyHint': '{{answered}} / {{cap}} câu hôm nay',
      }
      let s = dict[key] ?? key
      if (opts) {
        for (const [k, v] of Object.entries(opts)) {
          s = s.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v))
        }
      }
      return s
    },
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

  it('HRV-12 vintage — bg-deep + line border + chunky-soft + subtle ruby radial', () => {
    render(
      <RankedStandardCard
        energyRemaining={100}
        rankedAnswered={0}
        rankedCap={100}
        onEnter={() => {}}
      />
    )
    const card = screen.getByTestId('ranked-standard-card')
    // Vintage uses Tailwind utility classes for base look — assert classes
    // first (more stable than inline style assertions).
    expect(card.className).toContain('bg-bg-deep')
    expect(card.className).toContain('border-line')
    expect(card.className).toContain('shadow-chunky-soft')
    // Subtle ruby radial sits in inline style (background-image).
    const styleAttr = (card.getAttribute('style') ?? '').replace(/\s+/g, '')
    expect(styleAttr).toContain('radial-gradient')
    expect(styleAttr).toContain('rgba(199,62,62,0.12)')
  })
})
