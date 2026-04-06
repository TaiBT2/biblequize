import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Profile page tests — API-driven (no hardcoded data).
 * Tests: user name from API, tier progress computed, loading skeleton, empty badges.
 */

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

let authState = { isAuthenticated: true, isLoading: false, user: { name: 'Nguyễn Văn A', email: 'a@b.com' } }
vi.mock('../../store/authStore', () => ({
  useAuthStore: (s?: (st: any) => any) => s ? s(authState) : authState,
  useAuth: () => authState,
}))

const mockGet = vi.fn()
vi.mock('../../api/client', () => ({
  api: { get: (...args: any[]) => mockGet(...args) },
}))

import Profile from '../Profile'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
}

function renderProfile() {
  const qc = createQueryClient()
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Profile />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const MOCK_PROFILE = {
  name: 'Trần Văn B',
  email: 'b@test.com',
  avatarUrl: 'https://example.com/avatar.jpg',
  totalPoints: 2500,
  currentStreak: 5,
  longestStreak: 12,
  role: 'USER',
}

const MOCK_ACHIEVEMENTS = [
  { id: '1', name: 'Học giả', description: 'Đọc 50 chương', icon: 'auto_stories', unlockedAt: '2024-01-01' },
  { id: '2', name: 'Rực cháy', description: '7 ngày liên tiếp', icon: 'local_fire_department', unlockedAt: null },
]

beforeEach(() => {
  mockGet.mockReset()
  authState = { isAuthenticated: true, isLoading: false, user: { name: 'Nguyễn Văn A', email: 'a@b.com' } }
})

function setupMocks(overrides?: { profile?: any; achievements?: any; history?: any }) {
  mockGet.mockImplementation((url: string) => {
    if (url === '/api/me') return Promise.resolve({ data: overrides?.profile ?? MOCK_PROFILE })
    if (url === '/api/achievements/me') return Promise.resolve({ data: overrides?.achievements ?? MOCK_ACHIEVEMENTS })
    if (url === '/api/me/history') return Promise.resolve({ data: overrides?.history ?? { content: [] } })
    return Promise.reject(new Error(`Unmocked URL: ${url}`))
  })
}

describe('Profile page (API-driven)', () => {
  it('renders user name from API', async () => {
    setupMocks()
    renderProfile()
    expect(await screen.findByText('Trần Văn B')).toBeTruthy()
  })

  it('renders tier progress computed from totalPoints', async () => {
    // 2500 points = "Người Tìm Kiếm" / "tiers.seeker" tier (1000-4999)
    setupMocks()
    renderProfile()
    // i18n mock returns key as value: "tiers.seeker"
    const matches = await screen.findAllByText(/tiers\.seeker|Người Tìm Kiếm/)
    expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('shows loading skeleton initially', () => {
    // Never resolve API calls so we stay in loading state
    mockGet.mockReturnValue(new Promise(() => {}))
    renderProfile()
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders quick stats from API data', async () => {
    setupMocks()
    renderProfile()
    // totalPoints = 2,500
    expect(await screen.findByText('2,500')).toBeTruthy()
    // longestStreak = 12
    expect(screen.getByText('12 ngày')).toBeTruthy()
    // currentStreak = 5
    expect(screen.getByText('5 ngày')).toBeTruthy()
  })

  it('shows empty badges message when no achievements', async () => {
    setupMocks({ achievements: [] })
    renderProfile()
    expect(await screen.findByText('Chưa có huy hiệu nào')).toBeTruthy()
  })

  it('renders unlocked and locked badges', async () => {
    setupMocks()
    renderProfile()
    expect(await screen.findByText('Học giả')).toBeTruthy()
    expect(screen.getByText('Rực cháy')).toBeTruthy()
  })

  it('shows empty heatmap message when no history', async () => {
    setupMocks({ history: { content: [] } })
    renderProfile()
    expect(await screen.findByText('Bắt đầu chơi để xem nhật ký học tập')).toBeTruthy()
  })

  it('shows login prompt when not authenticated', () => {
    authState = { isAuthenticated: false, isLoading: false, user: null as any }
    setupMocks()
    renderProfile()
    expect(screen.getByText(/đăng nhập để xem hồ sơ/i)).toBeTruthy()
  })

  it('shows error state when profile API fails', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url === '/api/me') return Promise.reject(new Error('Network error'))
      if (url === '/api/achievements/me') return Promise.resolve({ data: [] })
      if (url === '/api/me/history') return Promise.resolve({ data: { content: [] } })
      return Promise.reject(new Error(`Unmocked URL: ${url}`))
    })
    renderProfile()
    expect(await screen.findByText(/Không thể tải hồ sơ/)).toBeTruthy()
  })

  it('renders heatmap section heading', async () => {
    setupMocks()
    renderProfile()
    expect(await screen.findByText(/Nhật Ký Học Tập/)).toBeTruthy()
  })
})
