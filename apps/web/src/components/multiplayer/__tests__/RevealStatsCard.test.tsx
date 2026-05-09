import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RevealStatsCard from '../RevealStatsCard'

describe('RevealStatsCard', () => {
  it('renders all four cells with reaction time + points + rank', () => {
    render(<RevealStatsCard reactionMs={2400} pointsEarned={18} newRank={1} rankDelta={2} timeLimitSec={30} />)
    expect(screen.getByTestId('reveal-stats-card')).toBeInTheDocument()
    expect(screen.getByText('Thời gian')).toBeInTheDocument()
    expect(screen.getByText('2.4s')).toBeInTheDocument()
    expect(screen.getByText('Điểm câu này')).toBeInTheDocument()
    expect(screen.getByText('+18')).toBeInTheDocument()
    expect(screen.getByText('Hạng')).toBeInTheDocument()
    expect(screen.getByText(/↑ #1/)).toBeInTheDocument()
  })

  it('classifies speed as Nhanh when ≤30% of timeLimit used', () => {
    render(<RevealStatsCard reactionMs={5000} pointsEarned={10} newRank={3} rankDelta={0} timeLimitSec={30} />)
    expect(screen.getByText(/Nhanh/)).toBeInTheDocument()
  })

  it('classifies speed as Vừa in mid range', () => {
    render(<RevealStatsCard reactionMs={15000} pointsEarned={5} newRank={4} rankDelta={-1} timeLimitSec={30} />)
    expect(screen.getByText(/Vừa/)).toBeInTheDocument()
  })

  it('classifies speed as Chậm when over 66% of timeLimit', () => {
    render(<RevealStatsCard reactionMs={25000} pointsEarned={2} newRank={5} rankDelta={0} timeLimitSec={30} />)
    expect(screen.getByText(/Chậm/)).toBeInTheDocument()
  })

  it('renders 0 points + dot icon when player got it wrong', () => {
    render(<RevealStatsCard reactionMs={4000} pointsEarned={0} newRank={3} rankDelta={-2} timeLimitSec={30} />)
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText(/↓ #3/)).toBeInTheDocument()
  })
})
