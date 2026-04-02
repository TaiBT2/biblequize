import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import QuizResults from '../QuizResults'

const baseStats = {
  totalScore: 150,
  correctAnswers: 8,
  totalQuestions: 10,
  accuracy: 80,
  averageTime: 5000,
  totalTime: 50000,
  difficultyBreakdown: {
    easy: { correct: 3, total: 4, score: 40 },
    medium: { correct: 3, total: 3, score: 60 },
    hard: { correct: 2, total: 3, score: 50 },
  },
  timePerQuestion: [4000, 5000, 3000, 6000, 4000, 5000, 7000, 3000, 5000, 8000],
  questions: [
    { id: '1', book: 'Genesis', chapter: 1, difficulty: 'easy' as const, type: 'mcq', content: 'Q1', options: ['A','B','C','D'], correctAnswer: [0], explanation: 'E1' },
    { id: '2', book: 'Genesis', chapter: 2, difficulty: 'easy' as const, type: 'mcq', content: 'Q2', options: ['A','B','C','D'], correctAnswer: [1], explanation: 'E2' },
  ],
  userAnswers: [0, 1],
  questionScores: [20, 20],
}

const mockPlayAgain = vi.fn()
const mockBackToHome = vi.fn()

function renderResults(overrides: Partial<typeof baseStats> = {}) {
  return render(
    <MemoryRouter>
      <QuizResults stats={{ ...baseStats, ...overrides } as any} onPlayAgain={mockPlayAgain} onBackToHome={mockBackToHome} />
    </MemoryRouter>
  )
}

describe('QuizResults', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('renders score circle SVG', () => {
    renderResults()
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('displays accuracy percentage', () => {
    renderResults()
    expect(screen.getByText(/chính xác/)).toBeInTheDocument()
  })

  it('shows "Xuất sắc!" for ≥90%', () => {
    renderResults({ correctAnswers: 9, totalQuestions: 10 })
    expect(screen.getByText('Xuất sắc!')).toBeInTheDocument()
  })

  it('shows "Tốt lắm!" for ≥70%', () => {
    renderResults({ correctAnswers: 7, totalQuestions: 10 })
    expect(screen.getByText('Tốt lắm!')).toBeInTheDocument()
  })

  it('shows "Cố gắng thêm!" for <70%', () => {
    renderResults({ correctAnswers: 5, totalQuestions: 10 })
    expect(screen.getByText('Cố gắng thêm!')).toBeInTheDocument()
  })

  it('renders stat cards with glass-card class', () => {
    renderResults()
    const cards = document.querySelectorAll('.glass-card')
    expect(cards.length).toBeGreaterThanOrEqual(3)
  })

  it('renders score breakdown', () => {
    renderResults()
    expect(screen.getByText('Điểm cơ bản:')).toBeInTheDocument()
    expect(screen.getByText('Tổng cộng:')).toBeInTheDocument()
  })

  it('renders insights with strongest/weakest', () => {
    renderResults()
    expect(screen.getByText(/Mạnh nhất/)).toBeInTheDocument()
  })

  it('renders 3 action buttons', () => {
    renderResults()
    expect(screen.getByText('Xem lại')).toBeInTheDocument()
    expect(screen.getByText('Chơi lại')).toBeInTheDocument()
    expect(screen.getByText('Trang chủ')).toBeInTheDocument()
  })

  it('"Xem lại" navigates to /review', async () => {
    renderResults()
    await userEvent.setup().click(screen.getByText('Xem lại'))
    expect(mockNavigate).toHaveBeenCalledWith('/review', expect.anything())
  })

  it('"Chơi lại" calls onPlayAgain', async () => {
    renderResults()
    await userEvent.setup().click(screen.getByText('Chơi lại'))
    expect(mockPlayAgain).toHaveBeenCalled()
  })

  it('"Trang chủ" calls onBackToHome', async () => {
    renderResults()
    await userEvent.setup().click(screen.getByText('Trang chủ'))
    expect(mockBackToHome).toHaveBeenCalled()
  })

  it('shows error state when stats is null', () => {
    render(<MemoryRouter><QuizResults stats={null as any} onPlayAgain={mockPlayAgain} onBackToHome={mockBackToHome} /></MemoryRouter>)
    expect(screen.getByText('Không có dữ liệu kết quả')).toBeInTheDocument()
  })

  it('does NOT contain neon-* or CSS module classes', () => {
    renderResults()
    expect(document.body.innerHTML).not.toContain('neon-')
  })
})
