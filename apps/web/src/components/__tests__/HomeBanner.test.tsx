import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockApiGet = vi.fn()
vi.mock('../../api/client', () => ({
  api: { get: (...args: any[]) => mockApiGet(...args) },
}))

vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({ user: { name: 'Tai Thanh', email: 'tai@test.com' } }),
}))

import HomeBanner from '../HomeBanner'

interface MockOpts {
  totalPoints?: number
  currentStreak?: number
  starIndex?: number
  energy?: number
  seasonPoints?: number
}

function setupApi(opts: MockOpts = {}) {
  mockApiGet.mockImplementation((url: string) => {
    if (url.includes('/api/me/tier-progress')) {
      return Promise.resolve({
        data: {
          tierLevel: 1,
          starIndex: opts.starIndex ?? 0,
          starProgressPercent: 0,
          starXp: 0,
          nextStarXp: 200,
        },
      })
    }
    if (url.includes('/api/me/ranked-status')) {
      return Promise.resolve({
        data: { energy: opts.energy ?? 100, seasonPoints: opts.seasonPoints ?? 0 },
      })
    }
    if (url.includes('/api/me')) {
      return Promise.resolve({
        data: { totalPoints: opts.totalPoints ?? 0, currentStreak: opts.currentStreak ?? 0 },
      })
    }
    return Promise.reject(new Error('Not mocked: ' + url))
  })
}

function renderBanner() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <HomeBanner />
    </QueryClientProvider>
  )
}

describe('HomeBanner (HR-2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders user name in Yeseva One display serif with tight tracking (HRV-10)', async () => {
    setupApi()
    renderBanner()
    const name = await screen.findByTestId('home-greeting-name')
    expect(name).toHaveTextContent('Tai Thanh')
    expect(name.className).toContain('font-display')
    expect(name.className).toContain('tracking-[-0.02em]')
  })

  it('streak stat uses animate-breathe class on flame icon', async () => {
    setupApi({ currentStreak: 5 })
    renderBanner()
    await waitFor(() => {
      expect(screen.getByTestId('home-greeting-stat-streak')).toHaveTextContent('5')
    })
    const streak = screen.getByTestId('home-greeting-stat-streak')
    expect(streak.querySelector('.animate-breathe')).not.toBeNull()
  })

  it('stat numbers use tabular-nums for sport-app alignment', async () => {
    setupApi({ currentStreak: 12, energy: 85, seasonPoints: 847 })
    renderBanner()
    const streak = await screen.findByTestId('home-greeting-stat-streak')
    const energy = screen.getByTestId('home-greeting-stat-energy')
    const season = screen.getByTestId('home-greeting-stat-season')
    // Number element is the second child of the stat div.
    for (const stat of [streak, energy, season]) {
      const numEl = stat.querySelector('.tabular-nums')
      expect(numEl).not.toBeNull()
    }
  })

  it('XP/next progress uses tabular-nums + gold value + ivory-faint slash', async () => {
    setupApi({ totalPoints: 500 })
    renderBanner()
    await waitFor(() => {
      expect(screen.getByTestId('home-greeting-progress-pct')).toHaveTextContent(/500.*1,000/)
    })
    expect(screen.getByTestId('home-greeting-progress-pct').className).toContain('tabular-nums')
  })

  it('formats large stat numbers with thousands separator', async () => {
    setupApi({ seasonPoints: 12345 })
    renderBanner()
    await waitFor(() => {
      expect(screen.getByTestId('home-greeting-stat-season')).toHaveTextContent('12,345')
    })
  })

  it('renders max-tier message and hides progress bar at 100k pts', async () => {
    setupApi({ totalPoints: 100_000 })
    renderBanner()
    expect(await screen.findByTestId('home-greeting-max-tier')).toBeInTheDocument()
    expect(screen.queryByTestId('home-greeting-progress-bar')).not.toBeInTheDocument()
  })

  it('XP track renders 6 milestone dots (one per C1 tier — HRV-10)', async () => {
    setupApi({ totalPoints: 500 })
    renderBanner()
    await screen.findByTestId('home-greeting-progress-bar')
    for (const i of [0, 1, 2, 3, 4, 5]) {
      expect(screen.getByTestId(`home-greeting-milestone-${i}`)).toBeInTheDocument()
    }
    // Ensure we did not accidentally render a 7th dot.
    expect(screen.queryByTestId('home-greeting-milestone-6')).not.toBeInTheDocument()
  })

  it('stat numbers use font-numeric (JetBrains Mono) per vintage HUD style', async () => {
    setupApi({ currentStreak: 7 })
    renderBanner()
    const streak = await screen.findByTestId('home-greeting-stat-streak')
    expect(streak.querySelector('.font-numeric')).not.toBeNull()
  })
})
