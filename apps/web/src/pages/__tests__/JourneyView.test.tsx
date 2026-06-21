import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, o?: any) => (o ? `${k}:${JSON.stringify(o)}` : k),
    i18n: { language: 'vi' },
  }),
}))

const navigateMock = vi.fn()
vi.mock('react-router-dom', async (orig) => {
  const actual = await (orig() as Promise<typeof import('react-router-dom')>)
  return { ...actual, useNavigate: () => navigateMock, useParams: () => ({ id: 'g-1', journeyId: 'j-1' }) }
})

const openMutate = vi.fn()
let journeyData: any = null
let journeyState = { isLoading: false, isError: false }
vi.mock('../../hooks/useGroupJourney', () => ({
  useGroupJourney: () => ({ data: journeyData, ...journeyState }),
  useOpenNextWeek: () => ({ mutateAsync: openMutate, isPending: false }),
}))

import JourneyView from '../JourneyView'

const render_ = () => render(<MemoryRouter><JourneyView /></MemoryRouter>)

beforeEach(() => {
  vi.clearAllMocks()
  journeyState = { isLoading: false, isError: false }
  journeyData = {
    id: 'j-1', title: 'Hành trình Sáng Thế', status: 'ACTIVE',
    totalMembers: 4, weeksTotal: 3, weeksOpened: 1, viewerDoneCount: 0, viewerIsLeader: false,
    weeks: [
      { id: 'w-1', weekNumber: 1, title: 'Chương 1-3', status: 'OPEN', scheduledQuizId: 'sq-1', doneCount: 2, viewerDone: false },
      { id: 'w-2', weekNumber: 2, title: 'Chương 4-6', status: 'LOCKED' },
      { id: 'w-3', weekNumber: 3, title: 'Chương 7-9', status: 'LOCKED' },
    ],
  }
})

describe('JourneyView', () => {
  it('renders the progress hero with stage k/N', () => {
    render_()
    expect(screen.getByTestId('journey-progress-hero')).toBeInTheDocument()
    expect(screen.getByTestId('journey-stage')).toHaveTextContent('1/3')
    expect(screen.getAllByTestId('journey-week-card')).toHaveLength(3)
  })

  it('member: open week shows play → navigates to the scheduled quiz', () => {
    render_()
    fireEvent.click(screen.getByTestId('journey-week-play'))
    expect(navigateMock).toHaveBeenCalledWith('/groups/g-1/scheduled-quizzes/sq-1')
  })

  it('member: a done week shows the done badge and no play button', () => {
    journeyData.weeks[0].viewerDone = true
    render_()
    expect(screen.getByTestId('journey-week-done-badge')).toBeInTheDocument()
    expect(screen.queryByTestId('journey-week-play')).not.toBeInTheDocument()
  })

  it('leader: opens the next LOCKED week with the chosen deadline', async () => {
    journeyData.viewerIsLeader = true
    openMutate.mockResolvedValue({})
    render_()
    // Only the first locked week (week 2) exposes the open control.
    expect(screen.getAllByTestId('journey-open-next')).toHaveLength(1)
    await act(async () => { fireEvent.click(screen.getByTestId('journey-open-next-submit')) })
    await waitFor(() => expect(openMutate).toHaveBeenCalledTimes(1))
    // Default preset 7d → deadline is an ISO-ish string.
    expect(typeof openMutate.mock.calls[0][0]).toBe('string')
  })

  it('leader: toggles the "ai chưa làm" roster on an open week', () => {
    journeyData.viewerIsLeader = true
    journeyData.weeks[0].notDone = [{ userId: 'u-2', name: 'Mai' }, { userId: 'u-3', name: 'Nam' }]
    render_()
    const toggle = screen.getByTestId('journey-not-done').querySelector('button')!
    fireEvent.click(toggle)
    expect(screen.getByText('Mai')).toBeInTheDocument()
    expect(screen.getByText('Nam')).toBeInTheDocument()
  })

  it('shows the loading and error states', () => {
    journeyData = null
    journeyState = { isLoading: true, isError: false }
    const { rerender } = render_()
    expect(screen.getByTestId('journey-view-loading')).toBeInTheDocument()
    journeyState = { isLoading: false, isError: true }
    rerender(<MemoryRouter><JourneyView /></MemoryRouter>)
    expect(screen.getByTestId('journey-view-error')).toBeInTheDocument()
  })
})
