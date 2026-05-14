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

// HRV-17: stub i18n with the actual VN strings we want the tests to
// assert against. Without this stub, react-i18next returns the raw key
// in test env (no provider), which would defeat the assertions on the
// poetic hero h1 + tagline content.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => {
      const dict: Record<string, string> = {
        'home.hero.greetingAccent': 'cuộc hành trình',
        'home.hero.greetingSuffix': 'chờ con.',
        'home.hero.tagline': 'Hôm nay là ngày tốt để mở Kinh Thánh.',
        'home.defaultName': 'Bạn',
        'home.maxTierReached': 'Cấp tối đa',
        'tiers.newBeliever': 'Tân Tín Hữu',
        'tiers.seeker': 'Người Tìm Kiếm',
        'tiers.disciple': 'Môn Đồ',
        'tiers.sage': 'Hiền Triết',
        'tiers.prophet': 'Tiên Tri',
        'tiers.apostle': 'Sứ Đồ',
      }
      return dict[key] ?? opts?.defaultValue ?? key
    },
    i18n: { language: 'vi' },
  }),
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

  it('XP/next progress uses tabular-nums + gold value + ivory-faint slash', async () => {
    setupApi({ totalPoints: 500 })
    renderBanner()
    await waitFor(() => {
      expect(screen.getByTestId('home-greeting-progress-pct')).toHaveTextContent(/500.*1,000/)
    })
    expect(screen.getByTestId('home-greeting-progress-pct').className).toContain('tabular-nums')
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

  it('HRV-17 poetic hero h1 contains user name + accent phrase + suffix', async () => {
    setupApi({ totalPoints: 500 })
    renderBanner()
    const name = await screen.findByTestId('home-greeting-name')
    expect(name).toHaveTextContent('Tai Thanh,')
    expect(name).toHaveTextContent('cuộc hành trình')
    expect(name).toHaveTextContent('chờ con.')
  })

  it('HRV-17 rank chip pill shows current → next tier with pulsing gold dot', async () => {
    setupApi({ totalPoints: 500 })
    renderBanner()
    const chip = await screen.findByTestId('home-greeting-rank-chip')
    // Pill has rounded-full + bg-bg-deep + line border.
    expect(chip.className).toContain('rounded-full')
    expect(chip.className).toContain('bg-bg-deep')
    expect(chip.className).toContain('border-line')
    // Pulsing dot present.
    expect(chip.querySelector('.animate-pulse')).not.toBeNull()
  })

  it('HRV-17 rank chip is hidden at max tier (no next tier to display)', async () => {
    setupApi({ totalPoints: 100_000 })
    renderBanner()
    await screen.findByTestId('home-greeting-max-tier')
    expect(screen.queryByTestId('home-greeting-rank-chip')).not.toBeInTheDocument()
  })

  it('HRV-17 tagline encourages user to open Scripture', async () => {
    setupApi({ totalPoints: 500 })
    renderBanner()
    const tagline = await screen.findByTestId('home-greeting-tagline')
    expect(tagline.textContent?.toLowerCase()).toContain('kinh thánh')
  })

})
