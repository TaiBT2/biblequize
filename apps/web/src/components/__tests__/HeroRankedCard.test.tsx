import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import HeroRankedCard from '../HeroRankedCard'

// Stub i18next — return realistic VI strings for the keys the component
// actually consumes. {{interp}} placeholders get substituted from opts.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const dict: Record<string, string> = {
        'gameModes.ranked': 'Đấu Hạng',
        'home.heroRanked.label': 'Tiếp theo · Bước vào đấu trường',
        'home.heroRanked.tagline': 'Daily xong rồi — giờ cạnh tranh ranking thôi',
        'home.heroRanked.energyMeta': '{{remaining}} / {{max}} năng lượng',
        'home.heroRanked.progressMeta': '{{answered}} / {{cap}} câu hôm nay',
        'home.heroRanked.cta': 'Vào trận',
      }
      let template = dict[key] ?? key
      if (opts) {
        for (const [k, v] of Object.entries(opts)) {
          template = template.replace(new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'g'), String(v))
        }
      }
      return template
    },
  }),
}))

describe('HeroRankedCard (HR-4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders C2-compliant title "Đấu Hạng" + default label + tagline', () => {
    render(
      <HeroRankedCard
        energyRemaining={100}
        energyMax={100}
        rankedAnswered={0}
        rankedCap={100}
        onEnter={() => {}}
      />
    )
    expect(screen.getByTestId('hero-ranked-card-title')).toHaveTextContent('Đấu Hạng')
    expect(screen.getByTestId('hero-ranked-card-label')).toHaveTextContent(
      /Tiếp theo · Bước vào đấu trường/
    )
    expect(screen.getByTestId('hero-ranked-card-tagline')).toHaveTextContent(
      /Daily xong rồi/
    )
  })

  it('accepts custom label and tagline overrides', () => {
    render(
      <HeroRankedCard
        energyRemaining={100}
        energyMax={100}
        rankedAnswered={0}
        rankedCap={100}
        onEnter={() => {}}
        label="Custom label"
        tagline="Custom tagline"
      />
    )
    expect(screen.getByTestId('hero-ranked-card-label')).toHaveTextContent('Custom label')
    expect(screen.getByTestId('hero-ranked-card-tagline')).toHaveTextContent('Custom tagline')
  })

  it('fires onEnter when CTA button clicked', async () => {
    const onEnter = vi.fn()
    const user = userEvent.setup()
    render(
      <HeroRankedCard
        energyRemaining={100}
        energyMax={100}
        rankedAnswered={0}
        rankedCap={100}
        onEnter={onEnter}
      />
    )
    await user.click(screen.getByTestId('hero-ranked-card-cta'))
    expect(onEnter).toHaveBeenCalledTimes(1)
  })

  it('displays energy + ranked progress numerically', () => {
    render(
      <HeroRankedCard
        energyRemaining={73}
        energyMax={100}
        rankedAnswered={42}
        rankedCap={100}
        onEnter={() => {}}
      />
    )
    expect(screen.getByTestId('hero-ranked-card-energy')).toHaveTextContent('73 / 100')
    expect(screen.getByTestId('hero-ranked-card-progress')).toHaveTextContent('42 / 100')
  })

  it('HRV-12 vintage — bg-deep card + ruby radial glow at right (desktop) / bottom (mobile)', () => {
    // HRV-12 vintage redesign: card root uses bg-deep + line border +
    // chunky-soft shadow (vintage cta-ranked style). Glow overlays paint
    // a ruby radial — desktop anchored at right-center, mobile anchored
    // at bottom-center. Replaces V2 gold radial.
    render(
      <HeroRankedCard
        energyRemaining={0}
        energyMax={100}
        rankedAnswered={100}
        rankedCap={100}
        onEnter={() => {}}
      />
    )
    const card = screen.getByTestId('hero-ranked-card')
    const glowDesktop = screen.getByTestId('hero-ranked-card-glow-desktop')
    const glowMobile = screen.getByTestId('hero-ranked-card-glow-mobile')

    // jsdom normalizes rgba() with spaces after commas.
    const stripWS = (s: string) => s.replace(/\s+/g, '')

    // Card root uses vintage classes (bg-deep + line border + shadow-chunky-soft).
    expect(card.className).toContain('bg-bg-deep')
    expect(card.className).toContain('border-line')
    expect(card.className).toContain('shadow-chunky-soft')

    // Desktop glow: ruby radial anchored right-center.
    const desktopStyle = stripWS(glowDesktop.getAttribute('style') ?? '')
    expect(desktopStyle).toContain('radial-gradient')
    expect(desktopStyle).toContain('100%50%')
    expect(desktopStyle).toContain('rgba(199,62,62,0.30)')

    // Mobile glow: ruby radial anchored bottom-center.
    const mobileStyle = stripWS(glowMobile.getAttribute('style') ?? '')
    expect(mobileStyle).toContain('radial-gradient')
    expect(mobileStyle).toContain('50%100%')
    expect(mobileStyle).toContain('rgba(199,62,62,0.30)')
  })

  it('fires onEnter when card body clicked (not just CTA)', async () => {
    const onEnter = vi.fn()
    const user = userEvent.setup()
    render(
      <HeroRankedCard
        energyRemaining={100}
        energyMax={100}
        rankedAnswered={0}
        rankedCap={100}
        onEnter={onEnter}
      />
    )
    await user.click(screen.getByTestId('hero-ranked-card-title'))
    expect(onEnter).toHaveBeenCalledTimes(1)
  })
})
