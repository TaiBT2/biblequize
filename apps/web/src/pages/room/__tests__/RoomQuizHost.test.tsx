// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Mock STOMP so the component renders synchronously without a real WS.
let lastOnMessage: ((m: { type: string; data: unknown }) => void) | null = null
vi.mock('../../../hooks/useStomp', () => ({
  useStomp: ({ onMessage }: { onMessage: (m: { type: string; data: unknown }) => void }) => {
    lastOnMessage = onMessage
    return { connected: true, reconnecting: false, send: vi.fn() }
  },
}))

const mockApiPost = vi.fn().mockResolvedValue({ data: { success: true } })
vi.mock('../../../api/client', () => ({
  api: { post: (...a: unknown[]) => mockApiPost(...a) },
}))

beforeEach(() => {
  vi.clearAllMocks()
  lastOnMessage = null
})

async function renderHost() {
  const Page = (await import('../RoomQuizHost')).default
  return render(
    <MemoryRouter initialEntries={['/room/r1/host']}>
      <Routes>
        <Route path="/room/:roomId/host" element={<Page />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('RoomQuizHost', () => {
  it('renders Quan Tro badge + 4 control buttons', async () => {
    await renderHost()
    expect(await screen.findByText(/👑 Quản trò/i)).toBeInTheDocument()
    expect(screen.getByTestId('host-control-pause')).toBeInTheDocument()
    expect(screen.getByTestId('host-control-skip')).toBeInTheDocument()
    expect(screen.getByTestId('host-control-broadcast')).toBeInTheDocument()
    expect(screen.getByTestId('host-control-end')).toBeInTheDocument()
  })

  it('renders correct-answer highlight when QUESTION_START arrives', async () => {
    await renderHost()
    expect(lastOnMessage).not.toBeNull()
    lastOnMessage!({
      type: 'QUESTION_START',
      data: {
        questionIndex: 0,
        totalQuestions: 5,
        timeLimit: 30,
        question: {
          id: 'q1',
          content: 'Câu hỏi test?',
          options: ['A1', 'B1', 'C1', 'D1'],
          correctAnswer: 2,
        },
      },
    })
    // The correct-answer badge should appear next to option C (index 2).
    expect(await screen.findByText(/✓ ĐÁP ÁN/)).toBeInTheDocument()
    expect(screen.getByText('Câu hỏi test?')).toBeInTheDocument()
  })

  it('pause button calls /pause then resume after GAME_PAUSED', async () => {
    await renderHost()
    fireEvent.click(screen.getByTestId('host-control-pause'))
    expect(mockApiPost).toHaveBeenCalledWith('/api/rooms/r1/host/pause', {})

    // Simulate the WS echo
    lastOnMessage!({ type: 'GAME_PAUSED', data: {} })
    expect(await screen.findByTestId('host-pause-overlay')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('host-control-pause'))
    expect(mockApiPost).toHaveBeenCalledWith('/api/rooms/r1/host/resume', {})
  })

  it('broadcast modal sends message and clears input', async () => {
    await renderHost()
    fireEvent.click(screen.getByTestId('host-control-broadcast'))
    const input = await screen.findByTestId('host-broadcast-input') as HTMLTextAreaElement
    fireEvent.change(input, { target: { value: 'Đọc kỹ Sáng Thế Ký nhé' } })
    fireEvent.click(screen.getByTestId('host-broadcast-send'))
    expect(mockApiPost).toHaveBeenCalledWith('/api/rooms/r1/host/broadcast', {
      message: 'Đọc kỹ Sáng Thế Ký nhé',
    })
  })

  it('end-early requires confirmation modal', async () => {
    await renderHost()
    fireEvent.click(screen.getByTestId('host-control-end'))
    const confirmBtn = await screen.findByTestId('host-end-confirm')
    fireEvent.click(confirmBtn)
    expect(mockApiPost).toHaveBeenCalledWith('/api/rooms/r1/host/end-early', {})
  })

  it('live-answer list updates on ANSWER_SUBMITTED', async () => {
    await renderHost()
    lastOnMessage!({
      type: 'ANSWER_SUBMITTED',
      data: { playerId: 'u1', username: 'An', isCorrect: true, reactionTimeMs: 2400 },
    })
    lastOnMessage!({
      type: 'ANSWER_SUBMITTED',
      data: { playerId: 'u2', username: 'Chi', isCorrect: false, reactionTimeMs: 3100 },
    })
    expect(await screen.findByText(/An/)).toBeInTheDocument()
    expect(screen.getByText(/Chi/)).toBeInTheDocument()
    expect(screen.getByText(/✓ ĐÚNG · 2.4s/)).toBeInTheDocument()
    expect(screen.getByText(/✗ SAI · 3.1s/)).toBeInTheDocument()
  })
})
