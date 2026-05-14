import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import HeroRankedCard from '../HeroRankedCard'

// Stub i18next so t('gameModes.ranked') returns the BL-4 value.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => (key === 'gameModes.ranked' ? 'Đấu Hạng' : key),
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

  it('Variant 02 — glass base + radial gold glow at right (desktop) / bottom (mobile)', () => {
    // V2 redesign 2026-05-14: card root carries the dark glass base
    // (rgba(50,52,64,...)), then two responsive overlay divs paint the
    // radial gold glow — desktop anchored at right-center, mobile
    // anchored at bottom-center so the glow halos the stacked CTA.
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

    // Card root no longer carries a gold linear-gradient — just glass.
    const cardStyle = stripWS(card.getAttribute('style') ?? '')
    expect(cardStyle).toContain('rgba(50,52,64')
    expect(cardStyle).not.toContain('linear-gradient')

    // Desktop glow: radial anchored right-center.
    const desktopStyle = stripWS(glowDesktop.getAttribute('style') ?? '')
    expect(desktopStyle).toContain('radial-gradient')
    expect(desktopStyle).toContain('100%50%')
    expect(desktopStyle).toContain('rgba(232,168,50,0.35)')

    // Mobile glow: radial anchored bottom-center.
    const mobileStyle = stripWS(glowMobile.getAttribute('style') ?? '')
    expect(mobileStyle).toContain('radial-gradient')
    expect(mobileStyle).toContain('50%100%')
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
