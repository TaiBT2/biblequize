import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockApiGet = vi.fn()
vi.mock('../../api/client', () => ({
  api: { get: (...args: any[]) => mockApiGet(...args) },
}))

import HomeHud from '../HomeHud'

interface MockOpts {
  currentStreak?: number
  energy?: number
  seasonPoints?: number
}

function setupApi(opts: MockOpts = {}) {
  mockApiGet.mockImplementation((url: string) => {
    if (url.includes('/api/me/ranked-status')) {
      return Promise.resolve({
        data: { energy: opts.energy ?? 100, seasonPoints: opts.seasonPoints ?? 0 },
      })
    }
    if (url.includes('/api/me')) {
      return Promise.resolve({
        data: { totalPoints: 0, currentStreak: opts.currentStreak ?? 0 },
      })
    }
    return Promise.reject(new Error('Not mocked: ' + url))
  })
}

function renderHud() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <HomeHud />
    </QueryClientProvider>
  )
}

describe('HomeHud (HRV-16 vintage HUD)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // HRV-26 isolation: clear any persisted theme + reset html attr so
    // each test starts from a clean dark default.
    try {
      window.localStorage.removeItem('bq-theme')
    } catch {
      /* localStorage unavailable — ignore */
    }
    document.documentElement.removeAttribute('data-theme')
  })

  it('renders page title "Trang chủ" uppercase tracked', async () => {
    setupApi()
    renderHud()
    const title = screen.getByTestId('home-hud-title')
    expect(title.textContent?.toLowerCase()).toContain('trang chủ')
    expect(title.className).toContain('uppercase')
    expect(title.className).toContain('tracking-[0.22em]')
  })

  it('streak stat uses animate-breathe class on flame icon', async () => {
    setupApi({ currentStreak: 5 })
    renderHud()
    await waitFor(() => {
      expect(screen.getByTestId('home-greeting-stat-streak')).toHaveTextContent('5')
    })
    const streak = screen.getByTestId('home-greeting-stat-streak')
    expect(streak.querySelector('.animate-breathe')).not.toBeNull()
  })

  it('stat numbers use font-numeric (JetBrains Mono) + tabular-nums', async () => {
    setupApi({ currentStreak: 12, energy: 85, seasonPoints: 847 })
    renderHud()
    const streak = await screen.findByTestId('home-greeting-stat-streak')
    const energy = screen.getByTestId('home-greeting-stat-energy')
    const season = screen.getByTestId('home-greeting-stat-season')
    for (const stat of [streak, energy, season]) {
      const numEl = stat.querySelector('.font-numeric.tabular-nums')
      expect(numEl).not.toBeNull()
    }
  })

  it('formats large stat numbers with thousands separator', async () => {
    setupApi({ seasonPoints: 12345 })
    renderHud()
    await waitFor(() => {
      expect(screen.getByTestId('home-greeting-stat-season')).toHaveTextContent('12,345')
    })
  })

  it('stat pills use vintage chunky-soft shadow + line-soft border', async () => {
    setupApi({ currentStreak: 3 })
    renderHud()
    const streak = await screen.findByTestId('home-greeting-stat-streak')
    expect(streak.className).toContain('shadow-chunky-soft')
    expect(streak.className).toContain('border-line-soft')
    expect(streak.className).toContain('bg-bg-deep')
  })

  it('HRV-26 renders theme toggle button with ☾ glyph by default (dark)', async () => {
    setupApi()
    renderHud()
    const toggle = await screen.findByTestId('home-hud-theme-toggle')
    expect(toggle).toBeInTheDocument()
    // Default theme = dark → moon glyph shown (means "switch to light").
    expect(toggle.textContent?.trim()).toBe('☾')
  })

  it('HRV-26 theme toggle flips html[data-theme] + persists to localStorage', async () => {
    setupApi()
    renderHud()
    const toggle = await screen.findByTestId('home-hud-theme-toggle')
    // Click → switches to light. html[data-theme] becomes "light".
    toggle.click()
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })
    expect(window.localStorage.getItem('bq-theme')).toBe('light')
    // Click again → back to dark. attribute removed; storage = "dark".
    toggle.click()
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBeNull()
    })
    expect(window.localStorage.getItem('bq-theme')).toBe('dark')
  })
})
