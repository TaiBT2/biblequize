import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/test-utils'
import Header from '../Header'

// ---------- mocks ----------

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/' }),
  }
})

const mockLogout = vi.fn()
vi.mock('../../store/authStore', () => ({
  useAuth: () => mockAuthState,
  useAuthStore: () => mockAuthState,
}))

let mockAuthState: {
  user: { name: string; email: string } | null
  isAuthenticated: boolean
  logout: () => void
}

vi.mock('../../api/client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: { notifications: [], unreadCount: 0 } }),
    patch: vi.fn().mockResolvedValue({}),
  },
}))

// We need to import api mock reference after vi.mock
import { api } from '../../api/client'
const mockedApi = vi.mocked(api)

beforeEach(() => {
  mockAuthState = {
    user: { name: 'Thanh', email: 'thanh@example.com' },
    isAuthenticated: true,
    logout: mockLogout,
  }
  vi.clearAllMocks()
  mockedApi.get.mockResolvedValue({ data: { notifications: [], unreadCount: 0 } })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Header', () => {
  it('renders the logo with link to home', () => {
    renderWithProviders(<Header />)
    const logo = screen.getByText('BibleQuiz')
    expect(logo).toBeInTheDocument()
    expect(logo.closest('a')).toHaveAttribute('href', '/')
  })

  it('renders all navigation links', () => {
    renderWithProviders(<Header />)
    expect(screen.getByText('Trang chủ')).toBeInTheDocument()
    expect(screen.getByText('Hằng ngày')).toBeInTheDocument()
    expect(screen.getByText('Luyện tập')).toBeInTheDocument()
    expect(screen.getByText('Leo Rank')).toBeInTheDocument()
    expect(screen.getByText('Multiplayer')).toBeInTheDocument()
    expect(screen.getByText('Nhóm')).toBeInTheDocument()
    expect(screen.getByText('Bảng xếp hạng')).toBeInTheDocument()
  })

  it('shows user avatar initial and name when authenticated', () => {
    renderWithProviders(<Header />)
    expect(screen.getByText('T')).toBeInTheDocument() // first char of 'Thanh'
    expect(screen.getByText('Thanh')).toBeInTheDocument()
  })

  it('shows login link when not authenticated', () => {
    mockAuthState = { user: null, isAuthenticated: false, logout: mockLogout }
    renderWithProviders(<Header />)
    const loginLink = screen.getByText('Đăng nhập')
    expect(loginLink).toBeInTheDocument()
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login')
  })

  it('does not show notification bell when not authenticated', () => {
    mockAuthState = { user: null, isAuthenticated: false, logout: mockLogout }
    renderWithProviders(<Header />)
    expect(screen.queryByText('🔔')).not.toBeInTheDocument()
  })

  it('shows notification bell when authenticated', () => {
    renderWithProviders(<Header />)
    expect(screen.getByText('🔔')).toBeInTheDocument()
  })

  it('shows notification badge when there are unread notifications', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        notifications: [{ id: '1', title: 'Test', body: 'body', isRead: false, createdAt: new Date().toISOString(), type: 'daily_reminder' }],
        unreadCount: 3,
      },
    })
    renderWithProviders(<Header />)
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  it('toggles user dropdown on click', () => {
    renderWithProviders(<Header />)
    const userBtn = screen.getByText('Thanh').closest('button')!
    fireEvent.click(userBtn)
    expect(screen.getByText('Hồ sơ')).toBeInTheDocument()
    expect(screen.getByText('Thành tích')).toBeInTheDocument()
    expect(screen.getByText('Đăng xuất')).toBeInTheDocument()
  })

  it('navigates to profile when clicking profile link in dropdown', () => {
    renderWithProviders(<Header />)
    fireEvent.click(screen.getByText('Thanh').closest('button')!)
    const profileLink = screen.getByText('Hồ sơ').closest('a')!
    expect(profileLink).toHaveAttribute('href', '/profile')
  })

  it('calls logout when clicking logout button', () => {
    renderWithProviders(<Header />)
    fireEvent.click(screen.getByText('Thanh').closest('button')!)
    fireEvent.click(screen.getByText('Đăng xuất'))
    expect(mockLogout).toHaveBeenCalledOnce()
  })

  it('toggles notification dropdown on bell click', () => {
    renderWithProviders(<Header />)
    fireEvent.click(screen.getByText('🔔'))
    expect(screen.getByText('Thông báo')).toBeInTheDocument()
    expect(screen.getByText('Không có thông báo mới')).toBeInTheDocument()
  })

  it('shows notifications list when there are notifications', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        notifications: [
          { id: '1', title: 'Streak warning', body: 'Hãy hoàn thành ngay!', isRead: false, createdAt: new Date().toISOString(), type: 'streak_warning' },
        ],
        unreadCount: 1,
      },
    })
    renderWithProviders(<Header />)
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('🔔'))
    expect(screen.getByText('Streak warning')).toBeInTheDocument()
    expect(screen.getByText('Hãy hoàn thành ngay!')).toBeInTheDocument()
  })

  it('calls markAllAsRead when clicking "Đọc tất cả"', async () => {
    mockedApi.get.mockResolvedValue({
      data: {
        notifications: [
          { id: '1', title: 'N1', body: 'B1', isRead: false, createdAt: new Date().toISOString(), type: 'daily_reminder' },
        ],
        unreadCount: 1,
      },
    })
    renderWithProviders(<Header />)
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText('🔔'))
    fireEvent.click(screen.getByText('Đọc tất cả'))
    expect(mockedApi.patch).toHaveBeenCalledWith('/api/notifications/read-all')
  })

  it('shows "?" avatar when user name is not available', () => {
    mockAuthState = { user: null as any, isAuthenticated: true, logout: mockLogout }
    renderWithProviders(<Header />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })
})
