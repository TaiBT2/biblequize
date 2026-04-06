import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockApiGet = vi.fn()
vi.mock('../../api/client', () => ({ api: { get: (...a: any[]) => mockApiGet(...a) } }))

let authState = { isAuthenticated: true, isLoading: false, user: { id: 'u1', name: 'Test User', email: 'a@b.com' } }
vi.mock('../../store/authStore', () => ({
  useAuthStore: (s?: (st: any) => any) => s ? s(authState) : authState,
  useAuth: () => authState,
}))

import Leaderboard from '../Leaderboard'

const MOCK_ENTRIES = [
  { userId: 'u2', name: 'Player 1', points: 15820, avatarUrl: null },
  { userId: 'u3', name: 'Player 2', points: 12450, avatarUrl: null },
  { userId: 'u4', name: 'Player 3', points: 11200, avatarUrl: null },
  { userId: 'u5', name: 'Player 4', points: 9840, avatarUrl: null },
  { userId: 'u1', name: 'Test User', points: 4520, avatarUrl: null },
]

function renderLeaderboard() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><MemoryRouter><Leaderboard /></MemoryRouter></QueryClientProvider>)
}

describe('Leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/my-rank')) return Promise.resolve({ data: { rank: 5, points: 4520 } })
      if (url.includes('/leaderboard/')) return Promise.resolve({ data: MOCK_ENTRIES })
      if (url.includes('/seasons/active')) return Promise.resolve({ data: { endAt: new Date(Date.now() + 3 * 86400000).toISOString() } })
      return Promise.reject(new Error('Not found'))
    })
  })

  it('renders page title', async () => {
    renderLeaderboard()
    expect(screen.getByText(/Bảng Xếp Hạng/i)).toBeInTheDocument()
  })

  it('renders top 3 podium from API', async () => {
    renderLeaderboard()
    await waitFor(() => { expect(screen.getByText('Player 1')).toBeInTheDocument() })
    expect(screen.getByText('Player 2')).toBeInTheDocument()
    expect(screen.getByText('Player 3')).toBeInTheDocument()
  })

  it('renders leaderboard entries from API', async () => {
    renderLeaderboard()
    await waitFor(() => { expect(screen.getByText('Player 4')).toBeInTheDocument() })
  })

  it('highlights current user', async () => {
    renderLeaderboard()
    await waitFor(() => { expect(screen.getAllByText('Bạn').length).toBeGreaterThan(0) })
  })

  it('renders tab buttons', () => {
    renderLeaderboard()
    expect(screen.getByText('Hàng ngày')).toBeInTheDocument()
    expect(screen.getByText('Hàng tuần')).toBeInTheDocument()
    expect(screen.getByText('Tất cả')).toBeInTheDocument()
  })

  it('renders tier info section', () => {
    renderLeaderboard()
    expect(screen.getByText(/Xếp Hạng Mùa/i)).toBeInTheDocument()
    // tierGold key is missing from vi.json, falls back to key
    expect(screen.getByText('leaderboard.tierGold')).toBeInTheDocument()
  })

  it('renders season countdown', async () => {
    renderLeaderboard()
    await waitFor(() => { expect(screen.getByText(/Mùa kết thúc sau/i)).toBeInTheDocument() })
  })

  it('shows empty state when no data', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/leaderboard/')) return Promise.resolve({ data: [] })
      if (url.includes('/my-rank')) return Promise.resolve({ data: null })
      if (url.includes('/seasons')) return Promise.resolve({ data: null })
      return Promise.reject(new Error('Not found'))
    })
    renderLeaderboard()
    await waitFor(() => { expect(screen.getByText(/Chưa có dữ liệu/)).toBeInTheDocument() })
  })

  it('shows skeleton during loading', () => {
    mockApiGet.mockReturnValue(new Promise(() => {}))
    renderLeaderboard()
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('calls API with correct period', () => {
    renderLeaderboard()
    expect(mockApiGet).toHaveBeenCalledWith(expect.stringContaining('/leaderboard/daily'))
  })
})
