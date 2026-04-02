import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({ user: { name: 'Test', email: 'test@test.com' } }),
  useAuth: () => ({ user: { name: 'Test', email: 'test@test.com' } }),
}))

vi.mock('../../hooks/useRankedDataSync', () => ({
  useRankedDataSync: () => ({ isInitialized: true }),
}))

const mockApiGet = vi.fn()
const mockApiPost = vi.fn()
vi.mock('../../api/client', () => ({
  api: {
    get: (...args: any[]) => mockApiGet(...args),
    post: (...args: any[]) => mockApiPost(...args),
  },
}))

import Ranked from '../Ranked'

function renderRanked() {
  return render(<MemoryRouter><Ranked /></MemoryRouter>)
}

const RANKED_STATUS = {
  date: '2026-04-02',
  livesRemaining: 75,
  dailyLives: 100,
  questionsCounted: 34,
  pointsToday: 456,
  cap: 100,
  currentBook: 'Ma-thi-ơ',
  currentBookIndex: 39,
  isPostCycle: false,
  currentDifficulty: 'medium',
  nextBook: 'Mác',
  resetAt: new Date(Date.now() + 3600000).toISOString(),
  bookProgress: { currentIndex: 39, totalBooks: 66, currentBook: 'Ma-thi-ơ', nextBook: 'Mác', isCompleted: false, progressPercentage: 60 },
}

describe('Ranked Mode Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('ranked-status')) return Promise.resolve({ data: RANKED_STATUS })
      if (url.includes('my-rank')) return Promise.resolve({ data: { rank: 42, points: 2340 } })
      if (url.includes('leaderboard')) return Promise.resolve({ data: [] })
      if (url.includes('questions')) return Promise.resolve({ data: [] })
      return Promise.reject(new Error('Not found'))
    })
    mockApiPost.mockResolvedValue({ data: { sessionId: 'sess-1' } })
  })

  it('renders header with title and tier', async () => {
    renderRanked()
    await waitFor(() => {
      expect(screen.getByText('⚔️ Xếp hạng')).toBeInTheDocument()
    })
  })

  it('displays energy section with value', async () => {
    renderRanked()
    await waitFor(() => {
      expect(screen.getByText('Năng lượng')).toBeInTheDocument()
      expect(screen.getByText('75')).toBeInTheDocument()
    })
  })

  it('displays energy progress bar', async () => {
    renderRanked()
    await waitFor(() => {
      const bars = document.querySelectorAll('.gold-gradient')
      const energyBar = Array.from(bars).find(b => (b as HTMLElement).style.width === '75%')
      expect(energyBar).toBeTruthy()
    })
  })

  it('displays today stats: points and questions', async () => {
    renderRanked()
    await waitFor(() => {
      expect(screen.getByText('456')).toBeInTheDocument()
      expect(screen.getByText('Hôm nay')).toBeInTheDocument()
    })
  })

  it('displays current book Ma-thi-ơ', async () => {
    renderRanked()
    await waitFor(() => {
      expect(screen.getByText('Ma-thi-ơ')).toBeInTheDocument()
      expect(screen.getByText('Trung bình')).toBeInTheDocument()
    })
  })

  it('displays rank #42', async () => {
    renderRanked()
    await waitFor(() => {
      const ranks = screen.getAllByText('#42')
      expect(ranks.length).toBeGreaterThan(0)
    })
  })

  it('displays start button when energy > 0', async () => {
    renderRanked()
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Bắt đầu/ })
      expect(btn).toBeInTheDocument()
    })
  })

  it('shows disabled button when energy = 0', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('ranked-status'))
        return Promise.resolve({ data: { ...RANKED_STATUS, livesRemaining: 0 } })
      return Promise.reject(new Error('Not found'))
    })

    renderRanked()
    await waitFor(() => {
      expect(screen.getByText(/Hết năng lượng/)).toBeInTheDocument()
    })
  })

  it('shows skeleton during loading', () => {
    mockApiGet.mockReturnValue(new Promise(() => {}))
    renderRanked()
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows error state when API fails', async () => {
    mockApiGet.mockRejectedValue(new Error('Network error'))
    renderRanked()
    await waitFor(() => {
      expect(screen.getByText(/Không thể tải trạng thái xếp hạng/)).toBeInTheDocument()
      expect(screen.getByText('Thử lại')).toBeInTheDocument()
    })
  })

  it('clicking start navigates to /quiz with ranked mode', async () => {
    renderRanked()
    const user = userEvent.setup()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Bắt đầu/ })).toBeInTheDocument()
    })
    await user.click(screen.getByRole('button', { name: /Bắt đầu/ }))
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/quiz', expect.objectContaining({
        state: expect.objectContaining({ mode: 'ranked', isRanked: true }),
      }))
    })
  })

  it('does NOT show undefined or null in energy display', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('ranked-status'))
        return Promise.resolve({ data: { ...RANKED_STATUS, livesRemaining: undefined, dailyLives: undefined } })
      return Promise.reject(new Error('Not found'))
    })
    renderRanked()
    await waitFor(() => {
      expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument()
    })
  })
})
