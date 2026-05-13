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

vi.mock('../../components/RankedStandardCard', () => ({
  default: ({ onEnter }: { onEnter: () => void }) => (
    <button data-testid="ranked-standard-card" onClick={onEnter}>RankedStandardCard</button>
  ),
}))

vi.mock('../../components/DailyCompletedStrip', () => ({
  default: () => <div data-testid="daily-completed-strip">DailyCompletedStrip</div>,
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
  starIndex?: number
  /** Whether today's Daily Challenge has been completed. */
  dailyDone?: boolean
  /** Missions completed flag — affects motivation gating. */
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
          starIndex: opts.starIndex ?? 1,
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
      return Promise.resolve({
        data: { correctCount: 4, totalQuestions: 5, xpEarned: 50 },
      })
    if (url.includes('/api/daily-challenge'))
      return Promise.resolve({
        data: { alreadyCompleted: !!opts.dailyDone, totalQuestions: 5 },
      })
    if (url.includes('/api/me/journey'))
      return Promise.resolve({
        data: {
          summary: {
            totalBooks: 66, completedBooks: 0, inProgressBooks: 1, lockedBooks: 65,
            overallMasteryPercent: 0, currentBook: null,
          },
          books: [],
        },
      })
    if (url.includes('/api/me'))
      return Promise.resolve({
        data: { totalPoints: opts.totalPoints ?? 8200, currentStreak: opts.currentStreak ?? 0 },
      })
    return Promise.resolve({ data: {} })
  })
}

describe('Home Dashboard (HR-7 dynamic hierarchy)', () => {
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

  describe('Dynamic hierarchy — State A (Daily not done)', () => {
    beforeEach(() => setupApi({ dailyDone: false, totalPoints: 8200 }))

    it('renders FeaturedDailyCard (NOT DailyCompletedStrip + HeroRankedCard)', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('featured-daily-card')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('daily-completed-strip')).not.toBeInTheDocument()
      expect(screen.queryByTestId('hero-ranked-card')).not.toBeInTheDocument()
    })

    it('renders "Chế độ chơi chính" + "Chế độ đa dạng" sections (not "Khám phá thêm")', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByText('Chế độ chơi chính')).toBeInTheDocument()
      })
      expect(screen.getByText('Chế độ đa dạng')).toBeInTheDocument()
      expect(screen.queryByText('Khám phá thêm')).not.toBeInTheDocument()
    })

    it('Primary grid contains Practice (compact) + RankedStandardCard', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('ranked-standard-card')).toBeInTheDocument()
      })
      const primary = screen.getByTestId('home-primary-grid')
      expect(primary).toBeInTheDocument()
      expect(primary.contains(screen.getByTestId('ranked-standard-card'))).toBe(true)
    })
  })

  describe('Dynamic hierarchy — State B (Daily done)', () => {
    beforeEach(() => setupApi({ dailyDone: true, totalPoints: 8200 }))

    it('renders DailyCompletedStrip + HeroRankedCard (NOT FeaturedDailyCard)', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('daily-completed-strip')).toBeInTheDocument()
      })
      expect(screen.getByTestId('hero-ranked-card')).toBeInTheDocument()
      expect(screen.queryByTestId('featured-daily-card')).not.toBeInTheDocument()
    })

    it('HeroRankedCard sits BEFORE DailyMissionsCard in DOM order', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('hero-ranked-card')).toBeInTheDocument()
      })
      const hero = screen.getByTestId('hero-ranked-card')
      const missions = screen.getByTestId('home-daily-missions')
      expect(hero.compareDocumentPosition(missions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('renders "Khám phá thêm" section (not the State A pair)', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByText('Khám phá thêm')).toBeInTheDocument()
      })
      expect(screen.queryByText('Chế độ chơi chính')).not.toBeInTheDocument()
      expect(screen.queryByText('Chế độ đa dạng')).not.toBeInTheDocument()
    })

    it('"Khám phá thêm" grid uses lg:grid-cols-4', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('home-explore-grid')).toBeInTheDocument()
      })
      expect(screen.getByTestId('home-explore-grid').className).toContain('lg:grid-cols-4')
    })
  })

  describe('Common sections (both states)', () => {
    it('renders "Thi đấu cộng đồng" group section', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByText('Thi đấu cộng đồng')).toBeInTheDocument()
      })
      expect(screen.getByTestId('home-group-grid')).toBeInTheDocument()
    })

    it('renders verse + journey 2-col block', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('home-verse-journey')).toBeInTheDocument()
      })
      expect(screen.getByTestId('home-daily-verse')).toBeInTheDocument()
    })

    it('does NOT render Leaderboard inline (removed in HR-7)', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument()
      })
      expect(screen.queryByText('Bảng Xếp Hạng')).not.toBeInTheDocument()
      expect(screen.queryByTestId('home-leaderboard')).not.toBeInTheDocument()
    })

    it('does NOT render ActivityFeed (removed in HR-7)', async () => {
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('activity-empty-state')).not.toBeInTheDocument()
    })
  })

  describe('MotivationCard + Missions gating', () => {
    it('renders MotivationCard for new user (totalPoints<1000, no engagement)', async () => {
      setupApi({ totalPoints: 200, dailyDone: false, currentStreak: 0, missionsCompleted: false })
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('motivation-card')).toBeInTheDocument()
      })
    })

    it('hides DailyMissionsCard for new user (totalPoints<1000)', async () => {
      setupApi({ totalPoints: 200 })
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('motivation-card')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('home-daily-missions')).not.toBeInTheDocument()
    })

    it('shows DailyMissionsCard for active user (totalPoints≥1000)', async () => {
      setupApi({ totalPoints: 8200 })
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('home-daily-missions')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('motivation-card')).not.toBeInTheDocument()
    })

    it('hides MotivationCard for new user once Daily is done', async () => {
      setupApi({ totalPoints: 200, dailyDone: true })
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument()
      })
      // Wait for daily-challenge fetch to settle so motivation gating fires.
      await waitFor(() => {
        const calls = mockApiGet.mock.calls.map((c: any) => c[0])
        expect(calls.some((u: string) => u.includes('/api/daily-challenge'))).toBe(true)
      })
      expect(screen.queryByTestId('motivation-card')).not.toBeInTheDocument()
    })

    it('hides MotivationCard for new user with currentStreak > 0', async () => {
      setupApi({ totalPoints: 200, currentStreak: 3, dailyDone: false })
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument()
      })
      await waitFor(() => {
        const calls = mockApiGet.mock.calls.map((c: any) => c[0])
        expect(calls.some((u: string) => u.includes('/api/me/daily-missions'))).toBe(true)
      })
      expect(screen.queryByTestId('motivation-card')).not.toBeInTheDocument()
    })

    it('hides MotivationCard for new user with a completed mission', async () => {
      setupApi({ totalPoints: 200, missionsCompleted: true, dailyDone: false })
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument()
      })
      await waitFor(() => {
        const calls = mockApiGet.mock.calls.map((c: any) => c[0])
        expect(calls.some((u: string) => u.includes('/api/me/daily-missions'))).toBe(true)
      })
      expect(screen.queryByTestId('motivation-card')).not.toBeInTheDocument()
    })

    it('boundary: totalPoints=1000 hides MotivationCard, shows Missions', async () => {
      setupApi({ totalPoints: 1000 })
      renderHome()
      await waitFor(() => {
        expect(screen.getByTestId('home-daily-missions')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('motivation-card')).not.toBeInTheDocument()
    })
  })

  describe('Error handling', () => {
    it('renders empty state when all APIs fail (banner + tier fallback)', async () => {
      mockApiGet.mockResolvedValue({ data: {} })
      renderHome()
      await waitFor(() => {
        expect(screen.getAllByText(/Nghĩa/).length).toBeGreaterThan(0)
        expect(screen.getByTestId('home-greeting-tier-label').textContent).toContain('Tân Tín Hữu')
      })
    })

    it('no undefined/null leaks into UI when API returns empty data', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url.includes('/api/me')) return Promise.resolve({ data: {} })
        return Promise.resolve({ data: {} })
      })
      renderHome()
      await waitFor(() => {
        expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/null/i)).not.toBeInTheDocument()
      })
    })
  })
})
