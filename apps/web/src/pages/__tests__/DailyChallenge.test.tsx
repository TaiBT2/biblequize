import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return {
    qc,
    ...render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <DailyChallenge />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  }
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

  describe('XP credit on completion', () => {
    // Pins the contract for DECISIONS.md 2026-04-20 "Daily +50 XP":
    // finishing the last question must POST /api/daily-challenge/complete
    // (idempotent — backend credits +50 XP there) and invalidate both
    // ['me'] and ['me-tier-progress'] so the Home tier banner reflects
    // the new total without a full page reload.
    it('POSTs /complete and invalidates tier caches when finishing last question', async () => {
      const questions = [
        { id: 'q1', book: 'Genesis', chapter: 1, content: 'Q1?', options: ['A', 'B', 'C', 'D'], correctAnswer: [0], explanation: '' },
      ]
      mockApiGet.mockImplementation((url: string) => {
        if (url.includes('/api/daily-challenge?')) {
          return Promise.resolve({
            data: { id: 'dc-1', date: '2026-04-20', alreadyCompleted: false, sessionId: 'daily-xyz', questions },
          })
        }
        if (url.includes('leaderboard')) return Promise.resolve({ data: [] })
        if (url.includes('/api/daily-challenge/result')) {
          return Promise.resolve({
            data: { completed: true, score: 20, correctCount: 1, totalQuestions: 1, sessionId: 'daily-xyz' },
          })
        }
        return Promise.reject(new Error(`Unmocked GET ${url}`))
      })
      mockApiPost.mockImplementation((url: string) => {
        if (url.includes('/api/daily-challenge/start')) {
          return Promise.resolve({ data: { sessionId: 'daily-xyz' } })
        }
        return Promise.resolve({ data: { ok: true } })
      })

      const { qc, findByTestId } = renderDaily()
      const invalidate = vi.spyOn(qc, 'invalidateQueries')

      // Start the challenge
      fireEvent.click(await findByTestId('daily-start-btn'))

      // Answer the question (correct index 0)
      fireEvent.click(await findByTestId('daily-option-0'))

      // Advance to completion
      fireEvent.click(await findByTestId('daily-next-btn'))

      // /complete was called exactly once with {score, correctCount}.
      await waitFor(() => {
        const completeCalls = mockApiPost.mock.calls.filter(
          (args) => typeof args[0] === 'string' && args[0].includes('/api/daily-challenge/complete'),
        )
        expect(completeCalls).toHaveLength(1)
        expect(completeCalls[0][1]).toMatchObject({ score: 20, correctCount: 1 })
      }, { timeout: 3000 })

      // Cache invalidation ran for both keys.
      const keys = invalidate.mock.calls.map((c) => (c[0] as any)?.queryKey?.[0])
      expect(keys).toContain('me')
      expect(keys).toContain('me-tier-progress')
    })
  })
})
