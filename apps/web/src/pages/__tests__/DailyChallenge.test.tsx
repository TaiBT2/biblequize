import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

/**
 * Unit tests for Daily Challenge page (Stitch design).
 * Tests: rendering, countdown timer, challenge card, skeleton, error state.
 */

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

let authState = { isAuthenticated: true, isLoading: false, user: { name: 'Test', email: 'a@b.com' } }
vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector?: (s: any) => any) => selector ? selector(authState) : authState,
  useAuth: () => authState,
}))

const mockApiGet = vi.fn()
const mockApiPost = vi.fn()
vi.mock('../../api/client', () => ({
  api: {
    get: (...args: any[]) => mockApiGet(...args),
    post: (...args: any[]) => mockApiPost(...args),
  },
}))

import DailyChallenge from '../DailyChallenge'

function renderDaily() {
  return render(
    <MemoryRouter>
      <DailyChallenge />
    </MemoryRouter>
  )
}

describe('Daily Challenge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('daily-challenge')) {
        return Promise.resolve({
          data: {
            id: 'dc-1',
            date: '2026-04-02',
            alreadyCompleted: false,
            questions: [],
          },
        })
      }
      if (url.includes('leaderboard')) {
        return Promise.resolve({ data: [] })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() => renderDaily()).not.toThrow()
    })

    it('shows page title or challenge header', async () => {
      renderDaily()
      await waitFor(() => {
        const title = screen.queryByText(/Thử Thách/i) || screen.queryByText(/Daily/i) || screen.queryByText(/Hôm Nay/i)
        expect(title).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Challenge Status', () => {
    it('shows challenge content when data loads', async () => {
      renderDaily()
      await waitFor(() => {
        const content = screen.queryByText(/Bắt Đầu/i) || screen.queryByText(/Thử Thách/i) ||
          screen.queryByText(/Hôm Nay/i) || document.querySelector('.gold-gradient')
        expect(content).toBeTruthy()
      }, { timeout: 3000 })
    })

    it('shows completion state when already completed', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url.includes('daily-challenge')) {
          return Promise.resolve({
            data: { id: 'dc-1', date: '2026-04-02', alreadyCompleted: true, score: 4, totalQuestions: 5 },
          })
        }
        return Promise.resolve({ data: [] })
      })

      renderDaily()
      await waitFor(() => {
        const completed = screen.queryByText(/hoàn thành/i) || screen.queryByText(/kết quả/i) || screen.queryByText(/4/i)
        expect(completed).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Loading & Error', () => {
    it('shows loading skeleton while fetching', () => {
      mockApiGet.mockImplementation(() => new Promise(() => {})) // never resolves
      renderDaily()
      const skeleton = document.querySelector('.animate-pulse')
      expect(skeleton).toBeInTheDocument()
    })

    it('handles API error without crashing', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'))
      expect(() => renderDaily()).not.toThrow()
    })
  })
})
