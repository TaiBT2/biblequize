import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

let authState = { isAuthenticated: true, isLoading: false, user: { name: 'Test', email: 'a@b.com' } }
vi.mock('../../store/authStore', () => ({
  useAuthStore: (s?: (st: any) => any) => (s ? s(authState) : authState),
  useAuth: () => authState,
}))

const mockGet = vi.fn()
vi.mock('../../api/client', () => ({
  api: { get: (...args: any[]) => mockGet(...args) },
}))

import Tournaments from '../Tournaments'

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
}

function renderTournaments() {
  const client = createClient()
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Tournaments />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const SAMPLE_TOURNAMENTS = [
  {
    id: 't1',
    name: 'Giải Đấu Ngôi Lời 2024',
    status: 'IN_PROGRESS',
    currentRound: 2,
    participantCount: 64,
    maxParticipants: 128,
    createdAt: '2024-10-01T00:00:00Z',
    startAt: '2024-10-05T00:00:00Z',
    endAt: '2024-10-20T00:00:00Z',
  },
  {
    id: 't2',
    name: 'Mùa Thu Kinh Thánh',
    status: 'REGISTRATION',
    currentRound: null,
    participantCount: 30,
    maxParticipants: 64,
    createdAt: '2024-11-01T00:00:00Z',
    startAt: null,
    endAt: null,
  },
]

describe('Tournaments Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    mockGet.mockResolvedValue({ data: [] })
    expect(() => renderTournaments()).not.toThrow()
  })

  it('shows loading skeleton while fetching', () => {
    mockGet.mockReturnValue(new Promise(() => {})) // never resolves
    renderTournaments()
    expect(screen.getByTestId('tournaments-skeleton')).toBeTruthy()
  })

  it('renders page header', () => {
    mockGet.mockResolvedValue({ data: [] })
    renderTournaments()
    expect(screen.getByText('Giải Đấu')).toBeTruthy()
  })

  it('renders empty state when no tournaments', async () => {
    mockGet.mockResolvedValue({ data: [] })
    renderTournaments()
    await waitFor(() => {
      expect(screen.getByTestId('tournaments-empty')).toBeTruthy()
    })
    expect(screen.getByText('Chưa có giải đấu nào')).toBeTruthy()
  })

  it('renders tournament list from API', async () => {
    mockGet.mockResolvedValue({ data: SAMPLE_TOURNAMENTS })
    renderTournaments()
    await waitFor(() => {
      expect(screen.getByTestId('tournaments-list')).toBeTruthy()
    })
    expect(screen.getByText('Giải Đấu Ngôi Lời 2024')).toBeTruthy()
    expect(screen.getByText('Mùa Thu Kinh Thánh')).toBeTruthy()
  })

  it('shows participant count', async () => {
    mockGet.mockResolvedValue({ data: SAMPLE_TOURNAMENTS })
    renderTournaments()
    await waitFor(() => {
      expect(screen.getByText('64/128 thí sinh')).toBeTruthy()
    })
  })

  it('shows status badges', async () => {
    mockGet.mockResolvedValue({ data: SAMPLE_TOURNAMENTS })
    renderTournaments()
    await waitFor(() => {
      expect(screen.getByText('Đang diễn ra')).toBeTruthy()
      expect(screen.getByText('Đăng ký')).toBeTruthy()
    })
  })

  it('renders error state on fetch failure', async () => {
    mockGet.mockRejectedValue(new Error('Network error'))
    renderTournaments()
    await waitFor(() => {
      expect(screen.getByTestId('tournaments-error')).toBeTruthy()
    })
    expect(screen.getByText('Không thể tải danh sách giải đấu')).toBeTruthy()
    expect(screen.getByText('Thử lại')).toBeTruthy()
  })

  it('tournament cards are links to detail page', async () => {
    mockGet.mockResolvedValue({ data: SAMPLE_TOURNAMENTS })
    renderTournaments()
    await waitFor(() => {
      expect(screen.getByTestId('tournaments-list')).toBeTruthy()
    })
    const links = screen.getByTestId('tournaments-list').querySelectorAll('a')
    expect(links.length).toBe(2)
    expect(links[0].getAttribute('href')).toBe('/tournaments/t1')
    expect(links[1].getAttribute('href')).toBe('/tournaments/t2')
  })
})
