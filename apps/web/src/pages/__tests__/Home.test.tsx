import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// FeaturedDailyCard runs its own setInterval countdown; mock for clarity.
vi.mock('../../components/FeaturedDailyCard', () => ({
  default: ({ onStart }: { onStart: () => void }) => (
    <button data-testid="featured-daily-card" onClick={onStart}>FeaturedDailyCard</button>
  ),
}))

vi.mock('../../components/HeroRankedCard', () => ({
  default: ({ onEnter }: { onEnter: () => void }) => (
    <button data-testid="hero-ranked-card" onClick={onEnter}>HeroRankedCard</button>
  ),
}))

vi.mock('../../components/DailyCompletedStrip', () => ({
  default: () => <div data-testid="daily-completed-strip">DailyCompletedStrip</div>,
}))

// DailyMissionsCard is rendered for all users. Mock to keep specs focused
// on Home layout.
vi.mock('../../components/DailyMissionsCard', () => ({
  default: () => <div data-testid="daily-missions-card-mock">DailyMissionsCard</div>,
}))

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
  missionsCompleted?: boolean
}

function setupApi(opts: MockOpts = {}) {
  mockApiGet.mockImplementation((url: string) => {
    if (url.includes('/api/quiz/daily-bonus'))
      return Promise.resolve({ data: { hasBonus: false } })
    if (url.includes('/api/me/comeback-status'))
      return Promise.resolve({ data: { daysSinceLastPlay: 0, rewardTier: 'NONE', claimed: false, reward: null } })
    if (url.includes('/api/me/daily-missions')) {
      const completed = opts.missionsCompleted ?? false
      return Promise.resolve({
        data: {
          date: '2026-05-13',
          missions: [
            { slot: 1, type: 'answer_correct', description: 'x', progress: completed ? 3 : 1, target: 3, completed },
            { slot: 2, type: 'complete_daily_challenge', description: 'y', progress: 0, target: 1, completed: false },
            { slot: 3, type: 'answer_combo', description: 'z', progress: 0, target: 1, completed: false },
          ],
          allCompleted: false,
          bonusClaimed: false,
          bonusXp: 50,
        },
      })
    }
    if (url.includes('/api/me/tier-progress'))
      return Promise.resolve({
        data: {
          tierLevel: opts.totalPoints && opts.totalPoints >= 5000 ? 3 : 1,
          totalPoints: opts.totalPoints ?? 8200,
          starIndex: 1,
          starXp: 7000,
          nextStarXp: 9000,
          starProgressPercent: 60,
          tierProgressPercent: 32,
          nextTierPoints: 15000,
          milestone: null,
        },
      })
    if (url.includes('/api/me/ranked-status'))
      return Promise.resolve({
        data: { livesRemaining: 100, dailyLives: 100, questionsCounted: 0, cap: 100, seasonPoints: 0 },
      })
    if (url.includes('/api/daily-challenge/result'))
      return Promise.resolve({ data: { correctCount: 4, totalQuestions: 5, xpEarned: 50 } })
    if (url.includes('/api/daily-challenge'))
      return Promise.resolve({ data: { alreadyCompleted: !!opts.dailyDone, totalQuestions: 5 } })
    if (url.includes('/api/seasons/active'))
      return Promise.resolve({ data: { active: false } })
    if (url.includes('/api/me'))
      return Promise.resolve({
        data: { totalPoints: opts.totalPoints ?? 8200, currentStreak: opts.currentStreak ?? 0 },
      })
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
      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument()
      })
    })

    it('shows skeleton during initial load', () => {
      mockApiGet.mockReturnValue(new Promise(() => {}))
      renderHome()
      expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('has max-w-7xl container', async () => {
      renderHome()
      await waitFor(() => {
        expect(document.querySelector('.max-w-7xl')).toBeInTheDocument()
      })
    })

    it('renders the verse lightwell', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('home-verse')).toBeInTheDocument()
      })
    })
  })

  describe('Banner (HomeBanner)', () => {
    it('displays user name in banner', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('home-greeting-name')).toHaveTextContent('Nghĩa')
      })
    })

    it('displays tier label "Môn Đồ" for 8200 pts', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('home-greeting-tier-label')).toHaveTextContent('Môn Đồ')
      })
    })

    it('displays max-tier message at 100k+ pts', async () => {
      setupApi({ totalPoints: 100_000 })
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('home-greeting-max-tier')).toBeInTheDocument()
      })
    })
  })

  describe('Daily hierarchy — State A (Daily not done)', () => {
    beforeEach(() => setupApi({ dailyDone: false, totalPoints: 8200 }))

    it('renders FeaturedDailyCard (NOT DailyCompletedStrip + HeroRankedCard)', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('featured-daily-card')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('daily-completed-strip')).not.toBeInTheDocument()
      expect(screen.queryByTestId('hero-ranked-card')).not.toBeInTheDocument()
    })
  })

  describe('Daily hierarchy — State B (Daily done)', () => {
    beforeEach(() => setupApi({ dailyDone: true, totalPoints: 8200 }))

    it('renders DailyCompletedStrip + HeroRankedCard (NOT FeaturedDailyCard)', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('daily-completed-strip')).toBeInTheDocument()
      })
      expect(screen.getByTestId('hero-ranked-card')).toBeInTheDocument()
      expect(screen.queryByTestId('featured-daily-card')).not.toBeInTheDocument()
    })
  })

  describe('Core mode cards (3 jewels)', () => {
    it('renders "Chế độ chơi chính" section with study/ranked/rooms cards', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByText('Chế độ chơi chính')).toBeInTheDocument()
      })
      expect(screen.getByTestId('home-modes-grid')).toBeInTheDocument()
      expect(screen.getByTestId('home-mode-study')).toBeInTheDocument()
      expect(screen.getByTestId('home-mode-ranked')).toBeInTheDocument()
      expect(screen.getByTestId('home-mode-rooms')).toBeInTheDocument()
    })

    it('always renders DailyMissionsCard (today\'s quests)', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('home-daily-missions')).toBeInTheDocument()
      })
    })
  })

  describe('Dropped sections (Khung Sáng IA simplification)', () => {
    it('does NOT render the old variety / group / explore / journey sections', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument()
      })
      expect(screen.queryByText('Chế độ đa dạng')).not.toBeInTheDocument()
      expect(screen.queryByText('Khám phá thêm')).not.toBeInTheDocument()
      expect(screen.queryByText('Thi đấu cộng đồng')).not.toBeInTheDocument()
      expect(screen.queryByTestId('home-journey')).not.toBeInTheDocument()
      expect(screen.queryByTestId('home-leaderboard')).not.toBeInTheDocument()
    })
  })

  // HO-1: brand-new account leads with a "Bắt đầu từ đây" cue.
  describe('Empty-state for new users (HO-1)', () => {
    it('shows "Bắt đầu từ đây" cue for a brand-new user', async () => {
      setupApi({ totalPoints: 0, dailyDone: false, currentStreak: 0 })
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('home-start-here')).toBeInTheDocument()
      })
      expect(screen.getByTestId('home-daily-missions')).toBeInTheDocument()
      expect(screen.getByTestId('featured-daily-card')).toBeInTheDocument()
    })

    it('does NOT show the cue once the user has XP', async () => {
      setupApi({ totalPoints: 200, dailyDone: false, currentStreak: 0 })
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('home-modes-grid')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('home-start-here')).not.toBeInTheDocument()
    })

    it('does NOT show the cue when streak > 0 even at 0 XP', async () => {
      setupApi({ totalPoints: 0, dailyDone: false, currentStreak: 3 })
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('home-modes-grid')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('home-start-here')).not.toBeInTheDocument()
    })
  })

  describe('Error handling', () => {
    it('renders banner with name + tier fallback when all APIs return empty', async () => {
      mockApiGet.mockResolvedValue({ data: {} })
      renderHome()
      await waitFor(() => {
        expect(screen.getAllByText(/Nghĩa/).length).toBeGreaterThan(0)
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
