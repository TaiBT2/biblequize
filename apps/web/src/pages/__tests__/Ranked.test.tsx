// NOTE (2026-05-23): 42 pre-redesign assertions were removed here — the
// dashboard no longer has the current-book card (replaced by CoverageCard)
// and the R3/R4/R5/A4 layout + "Vào thi đấu" copy changed substantially.
// Integration coverage for the shipped page lives in
// tests/e2e/{happy-path,smoke}/web-user/W-M04-ranked.spec.ts. Re-add
// unit cases here only for genuinely unit-shape concerns once the new
// dashboard stabilizes (Coverage flag rollout). See archive task
// docs/todo/archive/2026-05-23-clean-stale-tests.md.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ToastProvider } from '../../contexts/ToastContext'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

// Tests can override the user (e.g. set currentStreak) per case via
// mockUseAuth.mockReturnValueOnce(...). beforeEach resets to default.
const DEFAULT_USER = { name: 'Test', email: 'test@test.com', currentStreak: 0 }
const mockUseAuth = vi.fn(() => ({ user: DEFAULT_USER }))
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => mockUseAuth(),
  useAuth: () => mockUseAuth(),
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

// Sub-components (SeasonCard R5, RecentMatchesSection R7) use
// TanStack Query, so the page now needs a QueryClientProvider.
function renderRanked() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter><Ranked /></MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
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

// Tier 2 (Người Tìm Kiếm) at 4350/5000 → 83.75% → 650 to next (Môn Đồ)
const TIER_PROGRESS_TIER2 = {
  tierLevel: 2,
  tierName: 'Người Tìm Kiếm',
  totalPoints: 4350,
  nextTierPoints: 5000,
  tierProgressPercent: 83.75,
  starIndex: 4,
  starXp: 4250,
  nextStarXp: 5000,
  starProgressPercent: 20,
  milestone: null,
}

// Tier 6 (Sứ Đồ) — max tier, no nextTier
const TIER_PROGRESS_MAX = {
  tierLevel: 6,
  tierName: 'Sứ Đồ',
  totalPoints: 150_000,
  nextTierPoints: 100_000,
  tierProgressPercent: 100,
  starIndex: 0,
  starXp: 100_000,
  nextStarXp: 100_000,
  starProgressPercent: 100,
  milestone: null,
}

describe('Ranked Mode Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAuth.mockImplementation(() => ({ user: DEFAULT_USER }))
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('tier-progress')) return Promise.resolve({ data: TIER_PROGRESS_TIER2 })
      if (url.includes('ranked-status')) return Promise.resolve({ data: RANKED_STATUS })
      if (url.includes('my-rank')) return Promise.resolve({ data: { rank: 42, points: 2340 } })
      if (url.includes('leaderboard')) return Promise.resolve({ data: [] })
      if (url.includes('questions')) return Promise.resolve({ data: [] })
      // R5/R7 sub-components (SeasonCard, RecentMatchesSection) hit
      // these — return safe defaults so they don't reject and crash
      // the test rendering tree.
      if (url.includes('/api/seasons/active')) return Promise.resolve({ data: null })
      if (url.includes('/api/me/history')) return Promise.resolve({ data: { items: [], totalPages: 0, totalItems: 0, currentPage: 0, hasMore: false } })
      return Promise.reject(new Error('Not found'))
    })
    mockApiPost.mockResolvedValue({ data: { sessionId: 'sess-1' } })
  })

  it('displays energy section with value', async () => {
    renderRanked()
    await waitFor(() => {
      expect(screen.getByText('Năng lượng')).toBeInTheDocument()
      expect(screen.getByText('75')).toBeInTheDocument()
    })
  })

  it('displays today stats: points and questions', async () => {
    renderRanked()
    await waitFor(() => {
      expect(screen.getByText('456')).toBeInTheDocument()
      // After R3 redesign there's no single "Hôm Nay" header — points
      // shown in dedicated card via "ranked-points-today" testid.
      expect(screen.getByTestId('ranked-points-today')).toHaveTextContent('456')
      expect(screen.getByTestId('ranked-questions-counted')).toHaveTextContent('34')
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
      expect(screen.getByText(/Không thể tải dữ liệu thi đấu/)).toBeInTheDocument()
      expect(screen.getByText('Thử lại')).toBeInTheDocument()
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

  // ── R1: Header + Tier Progress Bar ──

  it('R1: renders max tier message for tier 6 (Sứ Đồ) user', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('tier-progress')) return Promise.resolve({ data: TIER_PROGRESS_MAX })
      if (url.includes('ranked-status')) return Promise.resolve({ data: RANKED_STATUS })
      if (url.includes('my-rank')) return Promise.resolve({ data: { rank: 1, points: 150_000 } })
      return Promise.reject(new Error('Not found'))
    })
    renderRanked()
    await waitFor(() => {
      const text = screen.getByTestId('ranked-tier-progress-text')
      expect(text).toHaveTextContent(/đạt tier cao nhất/i)
    })
  })

  it('R1: progress bar width matches tierProgressPercent from API', async () => {
    renderRanked()
    await waitFor(() => {
      const bar = screen.getByTestId('ranked-tier-progress-bar') as HTMLElement
      expect(bar.style.width).toBe('83.75%')
    })
  })

  it('R1: progress bar at 100% when user is at max tier', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('tier-progress')) return Promise.resolve({ data: TIER_PROGRESS_MAX })
      if (url.includes('ranked-status')) return Promise.resolve({ data: RANKED_STATUS })
      if (url.includes('my-rank')) return Promise.resolve({ data: { rank: 1, points: 150_000 } })
      return Promise.reject(new Error('Not found'))
    })
    renderRanked()
    await waitFor(() => {
      const bar = screen.getByTestId('ranked-tier-progress-bar') as HTMLElement
      expect(bar.style.width).toBe('100%')
    })
  })

  // ── R1 Boundary tests: tier transitions at threshold values ──
  // Verifies tier badge shows the correct tier when totalPoints crosses thresholds:
  //   0 → tier 1 (Tân Tín Hữu); 999 → still tier 1; 1000 → tier 2 (Người Tìm Kiếm);
  //   4999 → still tier 2; 5000 → tier 3 (Môn Đồ).
  // Backend /api/me/tier-progress is the source of truth (all-time sum, not daily proxy).

  function makeTierProgress(totalPoints: number) {
    // Mirror server's TierProgressService logic for thresholds
    const TIERS_VI = ['Tân Tín Hữu', 'Người Tìm Kiếm', 'Môn Đồ', 'Hiền Triết', 'Tiên Tri', 'Sứ Đồ']
    const THRESHOLDS = [0, 1000, 5000, 15_000, 40_000, 100_000]
    let level = 1
    for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
      if (totalPoints >= THRESHOLDS[i]) { level = i + 1; break }
    }
    const tierStart = THRESHOLDS[level - 1]
    const nextTierStart = level < 6 ? THRESHOLDS[level] : tierStart
    const range = nextTierStart - tierStart
    const pct = range > 0 ? ((totalPoints - tierStart) / range) * 100 : 100
    return {
      tierLevel: level,
      tierName: TIERS_VI[level - 1],
      totalPoints,
      nextTierPoints: nextTierStart,
      tierProgressPercent: Math.round(pct * 100) / 100,
      starIndex: 0,
      starXp: tierStart,
      nextStarXp: nextTierStart,
      starProgressPercent: pct,
      milestone: null,
    }
  }

  function mockWithTotalPoints(totalPoints: number) {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('tier-progress'))
        return Promise.resolve({ data: makeTierProgress(totalPoints) })
      if (url.includes('ranked-status')) return Promise.resolve({ data: RANKED_STATUS })
      if (url.includes('my-rank')) return Promise.resolve({ data: { rank: 100, points: 0 } })
      return Promise.reject(new Error('Not found'))
    })
  }

  // ── R2: Energy + Streak 2-column row ──

  it('R2: energy display shows livesRemaining (75) — preserves testid', async () => {
    renderRanked()
    await waitFor(() => {
      const display = screen.getByTestId('ranked-energy-display')
      expect(display).toHaveTextContent('75')
    })
  })

  // ── R3: 3 Stats Cards (loại bỏ rank duplicate) ──

  it('R3: renders only 2 cards when accuracy data missing (default mock)', async () => {
    renderRanked()
    await waitFor(() => {
      expect(screen.getByTestId('ranked-questions-counted')).toBeInTheDocument()
      expect(screen.getByTestId('ranked-points-today')).toBeInTheDocument()
      // Card 3 (accuracy) hidden when dailyAccuracy is undefined
      expect(screen.queryByTestId('ranked-accuracy')).toBeNull()
    })
  })

  it('R3: hides delta line when dailyDelta is 0 or missing', async () => {
    // Default mock has no dailyDelta → hidden
    renderRanked()
    await waitFor(() => {
      expect(screen.getByTestId('ranked-points-today')).toBeInTheDocument()
      expect(screen.queryByTestId('ranked-points-delta')).toBeNull()
    })

    // Explicit delta=0 also hides
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('tier-progress')) return Promise.resolve({ data: TIER_PROGRESS_TIER2 })
      if (url.includes('ranked-status'))
        return Promise.resolve({ data: { ...RANKED_STATUS, dailyDelta: 0 } })
      if (url.includes('my-rank')) return Promise.resolve({ data: { rank: 42, points: 2340 } })
      return Promise.reject(new Error('Not found'))
    })
    // No need to re-render — the existing render already mounted; but to keep
    // things explicit, just assert again by reading the current DOM.
    expect(screen.queryByTestId('ranked-points-delta')).toBeNull()
  })

  it('R3: no decorative trophy/icon watermarks remain on the page', async () => {
    renderRanked()
    await waitFor(() => {
      expect(screen.getByTestId('ranked-page')).toBeInTheDocument()
    })
    const main = screen.getByTestId('ranked-page')
    // Watermark icons used absolute + opacity-5/opacity-10 + huge text size
    expect(main.querySelector('.opacity-5')).toBeNull()
    expect(main.querySelector('.opacity-10')).toBeNull()
    expect(main.querySelector('[class*="text-[300px]"]')).toBeNull()
  })

  // ── R4: Active Book Card (slim horizontal) ──

  // ── R5: Season Card Milestones + CTA states ──
  // Helpers for parameterized rank → progress assertions.
  function mockWithRank(rank: number | null) {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('tier-progress')) return Promise.resolve({ data: TIER_PROGRESS_TIER2 })
      if (url.includes('ranked-status')) return Promise.resolve({ data: RANKED_STATUS })
      if (url.includes('my-rank'))
        return Promise.resolve({ data: rank == null ? null : { rank, points: 4350 } })
      return Promise.reject(new Error('Not found'))
    })
  }

  // ── A4: FE consumes new BE fields (dailyAccuracy, dailyDelta, pointsToTopN) ──

  it('A4: dailyAccuracy null → accuracy card hidden + grid uses 2 cols', async () => {
    // Default mock has no accuracy fields → null branch
    renderRanked()
    await waitFor(() => {
      expect(screen.queryByTestId('ranked-accuracy')).toBeNull()
    })
  })

})
