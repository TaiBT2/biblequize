import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import CollectiveGrowthCard from '../CollectiveGrowthCard'

const useGrowthMock = vi.fn()
vi.mock('../../../hooks/useGroupCollectiveGrowth', () => ({
  useGroupCollectiveGrowth: (...args: any[]) => useGrowthMock(...args),
}))

describe('CollectiveGrowthCard', () => {
  beforeEach(() => useGrowthMock.mockReset())

  it('loading: shows skeleton', () => {
    useGrowthMock.mockReturnValue({ isLoading: true })
    render(<CollectiveGrowthCard groupId="g-1" />)
    expect(screen.getByTestId('collective-growth-loading')).toBeInTheDocument()
  })

  it('error / non-member: fails soft to a quiet note', () => {
    useGrowthMock.mockReturnValue({ isError: true })
    render(<CollectiveGrowthCard groupId="g-1" />)
    expect(screen.getByTestId('collective-growth-error')).toBeInTheDocument()
    expect(screen.queryByTestId('collective-growth-card')).toBeNull()
  })

  it('empty: totalLearned=0 shows the "start together" prompt', () => {
    useGrowthMock.mockReturnValue({ data: { totalLearned: 0, perSet: [] } })
    render(<CollectiveGrowthCard groupId="g-1" />)
    expect(screen.getByTestId('collective-growth-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('collective-growth-card')).toBeNull()
  })

  it('success: hero total, milestone %, contributors, per-set rows', () => {
    useGrowthMock.mockReturnValue({
      data: {
        totalLearned: 120,
        contributors: 4,
        masteryCompletions: 2,
        memberCount: 10,
        milestoneFloor: 100,
        nextMilestone: 250,
        milestonePct: 13,
        perSet: [
          { quizSetId: 'qs1', name: 'Phúc Âm Giăng', totalQuestions: 10, participants: 3, completions: 1, avgMasteryPct: 60 },
          { quizSetId: 'qs2', name: 'Sáng Thế', totalQuestions: 20, participants: 1, completions: 0, avgMasteryPct: 25 },
        ],
      },
    })
    render(<CollectiveGrowthCard groupId="g-1" />)
    expect(screen.getByTestId('collective-growth-card')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
    expect(screen.getByText('13%')).toBeInTheDocument()
    expect(screen.getByText('4/10')).toBeInTheDocument()
    expect(screen.getByText('Phúc Âm Giăng')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('25%')).toBeInTheDocument()
  })
})
