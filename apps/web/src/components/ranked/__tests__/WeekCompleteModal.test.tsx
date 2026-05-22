import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Key-passthrough i18n; verses return a fixed array for deterministic assertions.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, opts?: Record<string, unknown>) => {
      if (k === 'ranked.week_complete.verses') {
        return ['verse-0', 'verse-1', 'verse-2', 'verse-3']
      }
      return opts ? `${k}:${JSON.stringify(opts)}` : k
    },
  }),
}))

import WeekCompleteModal from '../WeekCompleteModal'

describe('WeekCompleteModal', () => {
  it('normal week: shows 6 book pills + start + defer CTAs', () => {
    const books = ['Genesis', 'Exodus', 'Joel', 'Amos', 'Ruth', 'Esther']
    render(
      <WeekCompleteModal
        isOpen
        onClose={() => {}}
        completedWeek={3}
        nextWeekBooks={books}
        onStartNextWeek={() => {}}
      />
    )
    books.forEach((b) => expect(screen.getByText(b)).toBeInTheDocument())
    expect(screen.getByText(/ranked\.week_complete\.start_next_cta/)).toBeInTheDocument()
    expect(screen.getByText(/ranked\.week_complete\.defer_cta/)).toBeInTheDocument()
  })

  it('mastery week (empty nextWeekBooks): no start CTA, close only', () => {
    render(
      <WeekCompleteModal
        isOpen
        onClose={() => {}}
        completedWeek={13}
        nextWeekBooks={[]}
        onStartNextWeek={() => {}}
      />
    )
    expect(screen.queryByText(/start_next_cta/)).not.toBeInTheDocument()
    expect(screen.getByText(/ranked\.week_complete\.close_cta/)).toBeInTheDocument()
    expect(screen.getByText(/mastery_week_body/)).toBeInTheDocument()
  })

  it('verse rotates deterministically by completedWeek % 4', () => {
    const { rerender } = render(
      <WeekCompleteModal isOpen onClose={() => {}} completedWeek={1}
        nextWeekBooks={['A','B','C','D','E','F']} onStartNextWeek={() => {}} />
    )
    expect(screen.getByText('verse-1')).toBeInTheDocument()
    rerender(
      <WeekCompleteModal isOpen onClose={() => {}} completedWeek={6}
        nextWeekBooks={['A','B','C','D','E','F']} onStartNextWeek={() => {}} />
    )
    expect(screen.getByText('verse-2')).toBeInTheDocument() // 6 % 4 = 2
  })

  it('start CTA calls onStartNextWeek then onClose', () => {
    const onStart = vi.fn()
    const onClose = vi.fn()
    render(
      <WeekCompleteModal isOpen onClose={onClose} completedWeek={3}
        nextWeekBooks={['A','B','C','D','E','F']} onStartNextWeek={onStart} />
    )
    fireEvent.click(screen.getByText(/start_next_cta/))
    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
