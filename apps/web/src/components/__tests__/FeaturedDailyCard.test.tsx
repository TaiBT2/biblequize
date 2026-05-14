import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// HRV-20: stub i18n with the VN translations the tests assert against.
// Previously the component used hardcoded VN strings; now it pulls them
// from t() keys, so the test must supply a mock that resolves them.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const dict: Record<string, string> = {
        'home.featuredDailyCard.label': 'Thử thách hôm nay · Mới sẵn sàng',
        'home.featuredDailyCard.title': 'Bắt đầu ngày mới với Lời Chúa',
        'home.featuredDailyCard.subtitle':
          '{{count}} câu · {{minutes}} phút · Reset mỗi 24 giờ · Cùng cộng đồng',
        'home.featuredDailyCard.questionCount': '{{count}} câu hỏi',
        'home.featuredDailyCard.minutesMeta': '~ {{minutes}} phút',
        'home.featuredDailyCard.participants': '{{count}} đã chơi hôm nay',
        'home.featuredDailyCard.countdownLabel': 'Còn lại trong ngày',
        'home.featuredDailyCard.cta': 'Bắt đầu hôm nay',
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

import FeaturedDailyCard from '../FeaturedDailyCard'

describe('FeaturedDailyCard (HR-3)', () => {
  it('renders title, tagline, and default meta (5 câu / 3 phút)', () => {
    render(<FeaturedDailyCard onStart={() => {}} countdownText="12:34:56" />)
    expect(screen.getByText('Bắt đầu ngày mới với Lời Chúa')).toBeInTheDocument()
    expect(screen.getByText(/5 câu · 3 phút/)).toBeInTheDocument()
    expect(screen.getByTestId('featured-daily-card-countdown')).toHaveTextContent('12:34:56')
  })

  it('fires onStart when CTA is clicked', async () => {
    const onStart = vi.fn()
    const user = userEvent.setup()
    render(<FeaturedDailyCard onStart={onStart} countdownText="00:00:01" />)
    await user.click(screen.getByTestId('featured-daily-card-cta'))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('hides global participants row when prop is undefined', () => {
    render(<FeaturedDailyCard onStart={() => {}} countdownText="00:00:01" />)
    expect(screen.queryByTestId('featured-daily-card-participants')).not.toBeInTheDocument()
  })

  it('hides global participants row when count is 0', () => {
    render(
      <FeaturedDailyCard onStart={() => {}} globalParticipants={0} countdownText="00:00:01" />
    )
    expect(screen.queryByTestId('featured-daily-card-participants')).not.toBeInTheDocument()
  })

  it('renders globalParticipants with locale-formatted number when > 0', () => {
    render(
      <FeaturedDailyCard onStart={() => {}} globalParticipants={1247} countdownText="00:00:01" />
    )
    const row = screen.getByTestId('featured-daily-card-participants')
    expect(row).toHaveTextContent('1,247')
    expect(row).toHaveTextContent('đã chơi hôm nay')
  })

  it('renders one dot indicator per questionCount', () => {
    render(
      <FeaturedDailyCard
        questionCount={7}
        onStart={() => {}}
        countdownText="00:00:01"
      />
    )
    const dotsContainer = screen.getByTestId('featured-daily-card-dots')
    const dots = dotsContainer.querySelectorAll('[aria-hidden]')
    expect(dots.length).toBe(7)
  })

  it('countdown label has tabular-nums for digit alignment', () => {
    render(<FeaturedDailyCard onStart={() => {}} countdownText="20:35:43" />)
    expect(screen.getByTestId('featured-daily-card-countdown').className).toContain('tabular-nums')
  })
})
