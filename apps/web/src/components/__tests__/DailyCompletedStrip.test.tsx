import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import DailyCompletedStrip from '../DailyCompletedStrip'

describe('DailyCompletedStrip (HR-6)', () => {
  it('renders correct/total score with "Giỏi lắm!" message at >= 80%', () => {
    render(
      <DailyCompletedStrip
        correctCount={4}
        totalCount={5}
        countdownText="20:35:43"
        onReview={() => {}}
      />
    )
    expect(screen.getByTestId('daily-completed-strip-score')).toHaveTextContent(
      '4/5 đúng — Giỏi lắm!'
    )
  })

  it('uses "Tốt lắm!" between 60% and 79%', () => {
    render(
      <DailyCompletedStrip
        correctCount={3}
        totalCount={5}
        countdownText="00:00:01"
        onReview={() => {}}
      />
    )
    expect(screen.getByTestId('daily-completed-strip-score')).toHaveTextContent('Tốt lắm!')
  })

  it('uses "Cố lên!" under 60%', () => {
    render(
      <DailyCompletedStrip
        correctCount={1}
        totalCount={5}
        countdownText="00:00:01"
        onReview={() => {}}
      />
    )
    expect(screen.getByTestId('daily-completed-strip-score')).toHaveTextContent('Cố lên!')
  })

  it('renders countdown text with tabular-nums class', () => {
    render(
      <DailyCompletedStrip
        correctCount={3}
        totalCount={5}
        countdownText="12:34:56"
        onReview={() => {}}
      />
    )
    const cd = screen.getByTestId('daily-completed-strip-countdown')
    expect(cd).toHaveTextContent('12:34:56')
    expect(cd.className).toContain('tabular-nums')
  })

  it('renders trailingText when provided', () => {
    render(
      <DailyCompletedStrip
        correctCount={3}
        totalCount={5}
        countdownText="00:00:01"
        trailingText="Hành trình qua 5 sách"
        onReview={() => {}}
      />
    )
    expect(screen.getByTestId('daily-completed-strip-sub')).toHaveTextContent(
      'Hành trình qua 5 sách'
    )
  })

  it('fires onReview when "Xem lại bài làm" button is clicked', async () => {
    const onReview = vi.fn()
    const user = userEvent.setup()
    render(
      <DailyCompletedStrip
        correctCount={3}
        totalCount={5}
        countdownText="00:00:01"
        onReview={onReview}
      />
    )
    await user.click(screen.getByTestId('daily-completed-strip-review'))
    expect(onReview).toHaveBeenCalledTimes(1)
  })
})
