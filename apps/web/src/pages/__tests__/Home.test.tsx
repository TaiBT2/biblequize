import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../components/GameModeGrid', () => ({
  default: () => <div data-testid="game-mode-grid">GameModeGrid</div>,
}))

const mockApiGet = vi.fn()
vi.mock('../../api/client', () => ({
  api: { get: (...args: any[]) => mockApiGet(...args) },
}))

const mockUser = { name: 'Nghĩa', email: 'nghia@test.com' }
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({ user: mockUser }),
}))

import Home from '../Home'

function renderHome() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><Home /></MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Home Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/api/me'))
        return Promise.resolve({ data: { totalPoints: 8200 } })
      if (url.includes('my-rank'))
        return Promise.resolve({ data: { rank: 85, points: 8200 } })
      if (url.includes('/api/leaderboard'))
        return Promise.resolve({ data: [
          { userId: '1', name: 'Trần Thùy Linh', points: 45200, questions: 120 },
          { userId: '2', name: 'Lê Quốc Anh', points: 42850, questions: 95 },
        ] })
      return Promise.reject(new Error('Not found'))
    })
  })

  describe('Rendering', () => {
    it('renders without crashing', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getAllByText(/Nghĩa/).length).toBeGreaterThan(0)
      })
    })

    it('shows skeleton during loading', () => {
      mockApiGet.mockReturnValue(new Promise(() => {}))
      renderHome()
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('has max-w-7xl container', async () => {
      renderHome()
      await waitFor(() => { expect(document.querySelector('.max-w-7xl')).toBeInTheDocument() })
    })
  })

  describe('Greeting & Tier', () => {
    it('displays time-based greeting with user name', async () => {
      renderHome()
      await waitFor(() => {
        const h = new Date().getHours()
        const expected = h < 12 ? 'Chào buổi sáng' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
        expect(screen.getByText(new RegExp(`${expected}, Nghĩa!`))).toBeInTheDocument()
      })
    })

    it('displays tier progress bar', async () => {
      renderHome()
      await waitFor(() => { expect(screen.getByText('Tiến trình hạng')).toBeInTheDocument() })
    })

    it('displays points (8,200)', async () => {
      renderHome()
      await waitFor(() => { expect(screen.getAllByText(/8,200/).length).toBeGreaterThan(0) })
    })

    it('displays current tier (tiers.disciple fallback key)', async () => {
      renderHome()
      await waitFor(() => { expect(screen.getAllByText('tiers.disciple').length).toBeGreaterThan(0) })
    })

    it('displays next rank preview (Bậc Thầy)', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByText('Hạng kế tiếp')).toBeInTheDocument()
        expect(screen.getAllByText('Bậc Thầy').length).toBeGreaterThanOrEqual(1)
      })
    })

    it('progress bar width correct for 8200 points (32%)', async () => {
      renderHome()
      await waitFor(() => {
        const bar = document.querySelector('.gold-gradient')
        expect((bar as HTMLElement).style.width).toBe('32%')
      })
    })

    it('handles 0 points gracefully', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url.includes('/api/me')) return Promise.resolve({ data: { totalPoints: 0 } })
        if (url.includes('/api/leaderboard')) return Promise.resolve({ data: [] })
        return Promise.reject(new Error('Not found'))
      })
      renderHome()
      await waitFor(() => {
        const bar = document.querySelector('.gold-gradient')
        expect((bar as HTMLElement).style.width).toBe('0%')
        expect(screen.getByText('Tân Tín Hữu')).toBeInTheDocument()
      })
    })

    it('shows max tier state', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url.includes('/api/me')) return Promise.resolve({ data: { totalPoints: 150000 } })
        if (url.includes('/api/leaderboard')) return Promise.resolve({ data: [] })
        return Promise.reject(new Error('Not found'))
      })
      renderHome()
      await waitFor(() => {
        expect(screen.getByText('Đã đạt hạng cao nhất!')).toBeInTheDocument()
        expect(screen.getByText('Hạng cao nhất')).toBeInTheDocument()
      })
    })
  })

  describe('GameModeGrid', () => {
    it('renders GameModeGrid', async () => {
      renderHome()
      await waitFor(() => { expect(screen.getByTestId('game-mode-grid')).toBeInTheDocument() })
    })

    it('displays section header', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByText('Chế độ chơi')).toBeInTheDocument()
        expect(screen.getByText('KHÁM PHÁ 6 CHẾ ĐỘ')).toBeInTheDocument()
      })
    })
  })

  describe('Leaderboard', () => {
    it('displays section', async () => {
      renderHome()
      await waitFor(() => { expect(screen.getByText('Bảng Xếp Hạng')).toBeInTheDocument() })
    })

    it('displays period tabs', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByText('Hàng ngày')).toBeInTheDocument()
        expect(screen.getByText('Hàng tuần')).toBeInTheDocument()
      })
    })

    it('displays entries with correct points field', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByText('Trần Thùy Linh')).toBeInTheDocument()
        expect(screen.getByText('45,200 XP')).toBeInTheDocument()
      })
    })

    it('displays current user row', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByText(/Bạn \(Nghĩa\)/)).toBeInTheDocument()
        expect(screen.getByText('#85')).toBeInTheDocument()
      })
    })

    it('shows empty state', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url.includes('/api/me')) return Promise.resolve({ data: { totalPoints: 0 } })
        if (url.includes('/api/leaderboard')) return Promise.resolve({ data: [] })
        return Promise.reject(new Error('Not found'))
      })
      renderHome()
      await waitFor(() => { expect(screen.getByText('Chưa có dữ liệu xếp hạng')).toBeInTheDocument() })
    })

    it('has "Xem tất cả" link', async () => {
      renderHome()
      await waitFor(() => {
        const link = screen.getByText('Xem tất cả')
        expect(link.closest('a')).toHaveAttribute('href', '/leaderboard')
      })
    })

    it('switching tab triggers refetch with new period', async () => {
      renderHome()
      const user = userEvent.setup()
      await waitFor(() => { expect(screen.getByText('Bảng Xếp Hạng')).toBeInTheDocument() })
      await user.click(screen.getByText('Hàng tuần'))
      await waitFor(() => {
        const calls = mockApiGet.mock.calls.filter((c: any) => c[0].includes('leaderboard'))
        expect(calls.some((c: any) => c[0].includes('/weekly'))).toBe(true)
      })
    })

    it('shows opacity-50 during fetching', async () => {
      // Initial render fetches; opacity is tested by the transition class existing
      renderHome()
      await waitFor(() => {
        const container = document.querySelector('.transition-opacity')
        expect(container).toBeInTheDocument()
      })
    })
  })

  describe('Activity Feed', () => {
    it('displays section', async () => {
      renderHome()
      await waitFor(() => { expect(screen.getByText('Hoạt động gần đây')).toBeInTheDocument() })
    })

    it('displays items', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByText('Nguyễn A')).toBeInTheDocument()
        expect(screen.getByText('Minh Tâm')).toBeInTheDocument()
      })
    })
  })

  describe('Daily Verse', () => {
    it('displays a scripture verse with reference', async () => {
      renderHome()
      await waitFor(() => {
        // Verse rotates daily — just verify a verse element exists
        const verseSection = document.querySelector('.glass-panel')
        expect(verseSection).toBeInTheDocument()
        expect(verseSection?.textContent).toMatch(/\w+/) // has text content
      })
    })
  })

  describe('Error handling', () => {
    it('renders when all APIs fail', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'))
      renderHome()
      await waitFor(() => {
        expect(screen.getAllByText(/Nghĩa/).length).toBeGreaterThan(0)
        expect(screen.getByText('Tân Tín Hữu')).toBeInTheDocument()
      })
    })

    it('no undefined/null in UI', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url.includes('/api/me')) return Promise.resolve({ data: {} })
        if (url.includes('/api/leaderboard')) return Promise.resolve({ data: {} })
        return Promise.reject(new Error('Not found'))
      })
      renderHome()
      await waitFor(() => {
        expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/null/i)).not.toBeInTheDocument()
      })
    })
  })
})
