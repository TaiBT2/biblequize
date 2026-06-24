import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HeadToHead from '../HeadToHead'
import type { PlayerScore } from '../../../pages/room/RoomOverlays'

const p = (over: Partial<PlayerScore>): PlayerScore => ({
  playerId: 'x', username: 'X', score: 100, correctAnswers: 3, totalAnswered: 5, accuracy: 0.6, ...over,
})

describe('<HeadToHead>', () => {
  it('renders winner + runner-up cards with a VS divider', () => {
    render(<HeadToHead results={[
      p({ playerId: 'a', username: 'An', score: 120, finalRank: 2 }),
      p({ playerId: 'b', username: 'Bui', score: 252, finalRank: 1 }),
    ]} />)
    expect(screen.getByTestId('head-to-head')).toBeInTheDocument()
    expect(screen.getByTestId('h2h-card-1')).toHaveTextContent('Bui')
    expect(screen.getByTestId('h2h-card-2')).toHaveTextContent('An')
    expect(screen.getByText('VS')).toBeInTheDocument()
  })

  it('ranks by score when finalRank is absent (Speed Race)', () => {
    render(<HeadToHead results={[
      p({ playerId: 'a', username: 'An', score: 180 }),
      p({ playerId: 'b', username: 'Bui', score: 260 }),
    ]} />)
    expect(screen.getByTestId('h2h-card-1')).toHaveTextContent('Bui')
    expect(screen.getByTestId('h2h-card-2')).toHaveTextContent('An')
  })

  it('shows a tie badge when the two scores are equal', () => {
    render(<HeadToHead results={[
      p({ playerId: 'a', username: 'An', score: 147 }),
      p({ playerId: 'b', username: 'Bui', score: 147 }),
    ]} />)
    expect(screen.getByTestId('h2h-tie-badge')).toBeInTheDocument()
  })

  it('hides the tie badge when scores differ', () => {
    render(<HeadToHead results={[
      p({ playerId: 'a', username: 'An', score: 100 }),
      p({ playerId: 'b', username: 'Bui', score: 200 }),
    ]} />)
    expect(screen.queryByTestId('h2h-tie-badge')).not.toBeInTheDocument()
  })

  it('renders solo (no VS / runner-up) for a single player', () => {
    render(<HeadToHead results={[p({ playerId: 'a', username: 'Solo', score: 90 })]} />)
    expect(screen.getByTestId('h2h-card-1')).toHaveTextContent('Solo')
    expect(screen.queryByTestId('h2h-card-2')).not.toBeInTheDocument()
    expect(screen.queryByText('VS')).not.toBeInTheDocument()
  })
})
