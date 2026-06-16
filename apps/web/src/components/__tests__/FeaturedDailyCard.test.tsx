import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import FeaturedDailyCard from '../FeaturedDailyCard'

describe('FeaturedDailyCard (HR-3)', () => {
  it('renders title with "Lời Chúa" emphasis and default meta pills', () => {
    render(
      <FeaturedDailyCard
        onStart={() => {}}
        countdownText="12:34:56"
        todayOverride={new Date(2026, 4, 19)}
      />
    )
    // Title text is split across <span> for emphasis — use textContent match.
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent('Bắt đầu ngày mới với Lời Chúa')
    expect(screen.getByText(/5 câu/)).toBeInTheDocument()
    expect(screen.getByText(/~3 phút/)).toBeInTheDocument()
    expect(screen.getByText(/Cùng cộng đồng/)).toBeInTheDocument()
    expect(screen.getByTestId('featured-daily-card-countdown')).toHaveTextContent('12:34:56')
  })

  it('renders date label in dd/M format', () => {
    render(
      <FeaturedDailyCard
        onStart={() => {}}
        countdownText="00:00:01"
        todayOverride={new Date(2026, 4, 19)}
      />
    )
    expect(screen.getByTestId('featured-daily-card-date')).toHaveTextContent('19/5')
  })

  it('renders reward block with +150 XP', () => {
    render(<FeaturedDailyCard onStart={() => {}} countdownText="00:00:01" />)
    const reward = screen.getByTestId('featured-daily-card-reward')
    expect(reward).toHaveTextContent('Phần thưởng')
    expect(reward).toHaveTextContent('+150 XP')
  })

  it('CTA button text is "Bắt đầu" and fires onStart when clicked', async () => {
    const onStart = vi.fn()
    const user = userEvent.setup()
    render(<FeaturedDailyCard onStart={onStart} countdownText="00:00:01" />)
    const cta = screen.getByTestId('featured-daily-card-cta')
    expect(cta).toHaveTextContent('Bắt đầu')
    await user.click(cta)
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('countdown label has tabular-nums for digit alignment', () => {
    render(<FeaturedDailyCard onStart={() => {}} countdownText="20:35:43" />)
    expect(screen.getByTestId('featured-daily-card-countdown').className).toContain('tabular-nums')
  })
})
