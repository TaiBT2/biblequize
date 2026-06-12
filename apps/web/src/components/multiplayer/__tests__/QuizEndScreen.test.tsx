import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import QuizEndScreen from '../QuizEndScreen'
import type { PlayerScore } from '../../../pages/room/RoomOverlays'

const noop = () => {}

const SAMPLE: PlayerScore[] = [
  { playerId: 'a', username: 'An',  score: 198, correctAnswers: 11, totalAnswered: 15, accuracy: 0.73, finalRank: 2 },
  { playerId: 'b', username: 'Bui', score: 252, correctAnswers: 14, totalAnswered: 15, accuracy: 0.93, finalRank: 1 },
  { playerId: 'c', username: 'Chi', score: 156, correctAnswers: 9,  totalAnswered: 15, accuracy: 0.60, finalRank: 3 },
]

describe('QuizEndScreen', () => {
  const baseProps = {
    results: SAMPLE,
    totalQuestions: 15,
    startedAtMs: Date.now() - 7 * 60 * 1000,
    onReplay: noop, onClose: noop, onShare: noop, onNewRoom: noop, onHome: noop,
  }

  it('renders host view with replay + close buttons and host badge', () => {
    render(<QuizEndScreen {...baseProps} myUsername="Bui" isHost />)
    expect(screen.getByTestId('quiz-end-screen')).toBeInTheDocument()
    expect(screen.getByText(/Host view/)).toBeInTheDocument()
    expect(screen.getByText(/Lựa chọn của Host/)).toBeInTheDocument()
    expect(screen.getByTestId('end-host-replay')).toBeInTheDocument()
    expect(screen.getByTestId('end-host-close')).toBeInTheDocument()
    // host view does not render the player hero card
    expect(screen.queryByTestId('end-hero-card')).not.toBeInTheDocument()
    // player buttons should be absent
    expect(screen.queryByTestId('end-player-share')).not.toBeInTheDocument()
  })

  it('renders player view with hero card + share/new-room/home buttons', () => {
    render(<QuizEndScreen {...baseProps} myUsername="An" isHost={false} />)
    expect(screen.getByTestId('quiz-end-screen')).toBeInTheDocument()
    expect(screen.getByText(/Player view/)).toBeInTheDocument()
    expect(screen.getByTestId('end-hero-card')).toBeInTheDocument()
    expect(screen.getByText(/Hạng 2/)).toBeInTheDocument()
    expect(screen.getByTestId('end-player-share')).toBeInTheDocument()
    expect(screen.getByTestId('end-player-new-room')).toBeInTheDocument()
    expect(screen.getByTestId('end-player-home')).toBeInTheDocument()
    expect(screen.queryByTestId('end-host-replay')).not.toBeInTheDocument()
  })

  it('renders the podium', () => {
    render(<QuizEndScreen {...baseProps} myUsername="An" isHost={false} />)
    expect(screen.getByTestId('podium')).toBeInTheDocument()
  })

  it('derives rank from score order when the mode never assigns finalRank (Speed Race)', () => {
    // Regression: winner used to see "Chưa xếp hạng" because myRank read
    // finalRank only — Speed Race results carry no finalRank at all.
    const noRanks: PlayerScore[] = [
      { playerId: 'a', username: 'An',  score: 829, correctAnswers: 6, totalAnswered: 10, accuracy: 0.6 },
      { playerId: 'b', username: 'Bui', score: 811, correctAnswers: 6, totalAnswered: 9,  accuracy: 0.66 },
    ]
    render(<QuizEndScreen {...baseProps} results={noRanks} myUsername="An" isHost={false} />)
    expect(screen.getByText(/Hạng 1/)).toBeInTheDocument()
    expect(screen.queryByText(/Chưa xếp hạng/)).not.toBeInTheDocument()
  })

  it('identifies "me" by userId even when the localStorage display name drifted', () => {
    render(
      <QuizEndScreen
        {...baseProps}
        myUsername="stale-old-name"
        myUserId="b"
        isHost={false}
      />,
    )
    // PlayerScore b = Bui, finalRank 1 — must resolve via playerId, not username
    expect(screen.getByText(/Hạng 1/)).toBeInTheDocument()
    expect(screen.queryByText(/Chưa xếp hạng/)).not.toBeInTheDocument()
  })

  it('host actions wire to onReplay and onClose', () => {
    const onReplay = vi.fn()
    const onClose = vi.fn()
    render(<QuizEndScreen {...baseProps} myUsername="Bui" isHost onReplay={onReplay} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('end-host-replay'))
    expect(onReplay).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByTestId('end-host-close'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('analytics button only renders when onAnalytics is provided + wires the callback', () => {
    const { rerender } = render(<QuizEndScreen {...baseProps} myUsername="Bui" isHost />)
    expect(screen.queryByTestId('end-host-analytics')).not.toBeInTheDocument()

    const onAnalytics = vi.fn()
    rerender(<QuizEndScreen {...baseProps} myUsername="Bui" isHost onAnalytics={onAnalytics} />)
    const btn = screen.getByTestId('end-host-analytics')
    expect(btn).toHaveTextContent('Xem phân tích chi tiết')
    fireEvent.click(btn)
    expect(onAnalytics).toHaveBeenCalledOnce()
  })

  it('player actions wire to onShare/onNewRoom/onHome', () => {
    const onShare = vi.fn()
    const onNewRoom = vi.fn()
    const onHome = vi.fn()
    render(<QuizEndScreen {...baseProps} myUsername="An" isHost={false} onShare={onShare} onNewRoom={onNewRoom} onHome={onHome} />)
    fireEvent.click(screen.getByTestId('end-player-share'))
    fireEvent.click(screen.getByTestId('end-player-new-room'))
    fireEvent.click(screen.getByTestId('end-player-home'))
    expect(onShare).toHaveBeenCalledOnce()
    expect(onNewRoom).toHaveBeenCalledOnce()
    expect(onHome).toHaveBeenCalledOnce()
  })

  it('rankings list highlights the viewer with "(bạn)" suffix', () => {
    render(<QuizEndScreen {...baseProps} myUsername="An" isHost={false} />)
    expect(screen.getByText(/An.*\(bạn\)/)).toBeInTheDocument()
  })
})
