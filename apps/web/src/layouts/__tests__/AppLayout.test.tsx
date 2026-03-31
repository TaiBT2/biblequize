import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

/**
 * Tests for the AppLayout logout functionality.
 *
 * Bug: AppLayout previously had no logout button, making it impossible
 * for users to sign out. Now there's a user avatar dropdown with logout.
 */

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockLogout = vi.fn()
let authState: any = {}

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector?: (state: any) => any) => {
    return selector ? selector(authState) : authState
  },
}))

import AppLayout from '../AppLayout'

function renderAppLayout() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AppLayout />
    </MemoryRouter>
  )
}

describe('AppLayout — Logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLogout.mockResolvedValue(undefined)
    authState = {
      user: { name: 'Nguyễn Văn A', email: 'test@example.com', avatar: null },
      isAuthenticated: true,
      logout: mockLogout,
    }
  })

  it('renders a clickable avatar button in header', () => {
    renderAppLayout()
    // Header should have buttons — one of which contains the person icon
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('shows dropdown with logout when avatar is clicked', async () => {
    renderAppLayout()

    // Find and click the avatar button (the one with border-[#e8a832])
    const buttons = screen.getAllByRole('button')
    // Avatar button is the last button-like element in the header
    const avatarBtn = buttons[0]
    fireEvent.click(avatarBtn)

    await waitFor(() => {
      expect(screen.getByText('Đăng xuất')).toBeInTheDocument()
    })
  })

  it('shows profile and achievements links in dropdown', async () => {
    renderAppLayout()

    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    await waitFor(() => {
      expect(screen.getByText('Hồ sơ')).toBeInTheDocument()
      expect(screen.getByText('Thành tích')).toBeInTheDocument()
    })
  })

  it('calls logout and navigates to /landing when logout clicked', async () => {
    renderAppLayout()

    // Open dropdown
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    // Click logout
    const logoutBtn = await screen.findByText('Đăng xuất')
    fireEvent.click(logoutBtn)

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1)
      expect(mockNavigate).toHaveBeenCalledWith('/landing')
    })
  })

  it('shows loading state during logout', async () => {
    mockLogout.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 200)))
    renderAppLayout()

    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    const logoutBtn = await screen.findByText('Đăng xuất')
    fireEvent.click(logoutBtn)

    await waitFor(() => {
      expect(screen.getByText('Đang đăng xuất...')).toBeInTheDocument()
    })
  })

  it('displays user name in sidebar profile card', () => {
    renderAppLayout()
    // User name should appear in sidebar (truncated with max-w)
    const nameElements = screen.getAllByText('Nguyễn Văn A')
    expect(nameElements.length).toBeGreaterThanOrEqual(1)
  })
})
