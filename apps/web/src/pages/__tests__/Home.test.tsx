import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockApiGet = vi.fn()
vi.mock('../../api/client', () => ({
  api: { get: (...args: any[]) => mockApiGet(...args) },
}))

const mockUser = { name: 'Nghĩa', email: 'nghia@test.com' }
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({ user: mockUser }),
}))

vi.mock('../../store/onboardingStore', () => ({
  useOnboardingStore: () => ({ hasDoneTutorial: true, setHasDoneTutorial: vi.fn() }),
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

interface MockOpts {
  totalPoints?: number
  currentStreak?: number
  dailyDone?: boolean
}

function setupApi(opts: MockOpts = {}) {
  mockApiGet.mockImplementation((url: string) => {
    if (url.includes('/api/quiz/daily-bonus'))
      return Promise.resolve({ data: { hasBonus: false } })
    if (url.includes('/api/me/comeback-status'))
      return Promise.resolve({ data: { daysSinceLastPlay: 0, rewardTier: 'NONE', claimed: false, reward: null } })
    if (url.includes('/api/me/daily-missions'))
      return Promise.resolve({
        data: {
          date: '2026-05-13',
          missions: [
            { slot: 1, description: 'Chơi 1 ván bất kỳ', progress: 1, target: 1, completed: true },
            { slot: 2, description: 'Trả lời đúng 5 câu khó', progress: 1, target: 5, completed: false },
            { slot: 3, description: 'Đạt 60+ điểm Đấu Hạng', progress: 0, target: 1, completed: false },
          ],
        },
      })
    if (url.includes('/api/me/tier-progress'))
      return Promise.resolve({
        data: { tierLevel: opts.totalPoints && opts.totalPoints >= 5000 ? 3 : 1, totalPoints: opts.totalPoints ?? 8200 },
      })
    if (url.includes('/api/me/ranked-status'))
      return Promise.resolve({ data: { livesRemaining: 100, dailyLives: 100, seasonPoints: 0 } })
    if (url.includes('/api/seasons/active'))
      return Promise.resolve({ data: { active: false } })
    if (url.includes('/api/leaderboard/weekly/my-rank'))
      return Promise.resolve({ data: { rank: 1, total: 1204 } })
    if (url.includes('/api/daily-challenge/result'))
      return Promise.resolve({ data: { correctCount: 4, totalQuestions: 5, xpEarned: 50 } })
    if (url.includes('/api/daily-challenge'))
      return Promise.resolve({ data: { alreadyCompleted: !!opts.dailyDone, totalQuestions: 5 } })
    if (url.includes('/api/me'))
      return Promise.resolve({ data: { totalPoints: opts.totalPoints ?? 8200, currentStreak: opts.currentStreak ?? 0 } })
    return Promise.resolve({ data: {} })
  })
}

describe('Home Dashboard (Khung Sáng IA)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupApi()
  })

  describe('Rendering', () => {
    it('renders without crashing', async () => {
      renderHome()
      await waitFor(() => expect(screen.getByTestId('home-page')).toBeInTheDocument())
    })

    it('shows skeleton during initial load', () => {
      mockApiGet.mockReturnValue(new Promise(() => {}))
      renderHome()
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('has a centered max-width container', async () => {
      renderHome()
      await waitFor(() => expect(document.querySelector('.max-w-\\[1180px\\]')).toBeInTheDocument())
    })

    it('renders the verse lightwell', async () => {
      renderHome()
      await waitFor(() => expect(screen.getByTestId('home-verse')).toBeInTheDocument())
    })
  })

  describe('Hero', () => {
    it('displays the user name', async () => {
      renderHome()
      await waitFor(() => expect(screen.getByTestId('home-greeting-name')).toHaveTextContent('Nghĩa'))
    })

    it('displays tier label "Môn Đồ" for 8200 pts', async () => {
      renderHome()
      await waitFor(() => expect(screen.getByTestId('home-greeting-tier-label')).toHaveTextContent('Môn Đồ'))
    })

    it('displays max-tier message at 100k+ pts', async () => {
      setupApi({ totalPoints: 100_000 })
      renderHome()
      await waitFor(() => expect(screen.getByTestId('home-greeting-max-tier')).toBeInTheDocument())
    })
  })

  describe('Daily card', () => {
    it('State A (not done): renders daily card with "Chơi ngay" CTA', async () => {
      setupApi({ dailyDone: false, totalPoints: 8200 })
      renderHome()
      await waitFor(() => expect(screen.getByTestId('home-daily')).toBeInTheDocument())
      expect(screen.getByTestId('featured-daily-cta')).toHaveTextContent('Chơi ngay')
    })

    it('State B (done): CTA switches to "Xem lại"', async () => {
      setupApi({ dailyDone: true, totalPoints: 8200 })
      renderHome()
      await waitFor(() => expect(screen.getByTestId('featured-daily-cta')).toHaveTextContent('Xem lại'))
    })
  })

  describe('Quests + mode cards', () => {
    it('renders today\'s quests (home-daily-missions) with mission rows', async () => {
      renderHome()
      await waitFor(() => expect(screen.getByTestId('home-daily-missions')).toBeInTheDocument())
      expect(screen.getByText('Chơi 1 ván bất kỳ')).toBeInTheDocument()
    })

    it('renders "Chế độ chơi chính" with study/ranked/rooms cards', async () => {
      renderHome()
      await waitFor(() => expect(screen.getByText('Chế độ chơi chính')).toBeInTheDocument())
      expect(screen.getByTestId('home-modes-grid')).toBeInTheDocument()
      expect(screen.getByTestId('home-mode-study')).toBeInTheDocument()
      expect(screen.getByTestId('home-mode-ranked')).toBeInTheDocument()
      expect(screen.getByTestId('home-mode-rooms')).toBeInTheDocument()
    })
  })

  describe('Dropped sections (Khung Sáng IA simplification)', () => {
    it('does NOT render the old variety / explore / group / journey sections', async () => {
      renderHome()
      await waitFor(() => expect(screen.getByTestId('home-page')).toBeInTheDocument())
      expect(screen.queryByText('Chế độ đa dạng')).not.toBeInTheDocument()
      expect(screen.queryByText('Khám phá thêm')).not.toBeInTheDocument()
      expect(screen.queryByText('Thi đấu cộng đồng')).not.toBeInTheDocument()
      expect(screen.queryByTestId('home-journey')).not.toBeInTheDocument()
    })
  })

  describe('Empty-state for new users (HO-1)', () => {
    it('shows "Bắt đầu từ đây" cue for a brand-new user', async () => {
      setupApi({ totalPoints: 0, dailyDone: false, currentStreak: 0 })
      renderHome()
      await waitFor(() => expect(screen.getByTestId('home-start-here')).toBeInTheDocument())
      expect(screen.getByTestId('home-daily-missions')).toBeInTheDocument()
    })

    it('does NOT show the cue once the user has XP', async () => {
      setupApi({ totalPoints: 200, dailyDone: false, currentStreak: 0 })
      renderHome()
      await waitFor(() => expect(screen.getByTestId('home-modes-grid')).toBeInTheDocument())
      expect(screen.queryByTestId('home-start-here')).not.toBeInTheDocument()
    })

    it('does NOT show the cue when streak > 0 even at 0 XP', async () => {
      setupApi({ totalPoints: 0, dailyDone: false, currentStreak: 3 })
      renderHome()
      await waitFor(() => expect(screen.getByTestId('home-modes-grid')).toBeInTheDocument())
      expect(screen.queryByTestId('home-start-here')).not.toBeInTheDocument()
    })
  })

  describe('Error handling', () => {
    it('renders hero with name + tier fallback when all APIs return empty', async () => {
      mockApiGet.mockResolvedValue({ data: {} })
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('home-greeting-name')).toHaveTextContent('Nghĩa')
        expect(screen.getByTestId('home-greeting-tier-label').textContent).toContain('Tân Tín Hữu')
      })
    })

    it('no undefined/null leaks into UI when API returns empty data', async () => {
      mockApiGet.mockResolvedValue({ data: {} })
      renderHome()
      await waitFor(() => {
        expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/null/i)).not.toBeInTheDocument()
      })
    })
  })
})
