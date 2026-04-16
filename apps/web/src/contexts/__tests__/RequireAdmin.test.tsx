import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/test-utils'
import RequireAdmin from '../RequireAdmin'

// Mock the auth store
vi.mock('../../store/authStore', () => ({
  useAuth: vi.fn(),
  useAuthStore: vi.fn(),
}))

// Mock react-router-dom Navigate to capture props
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    Navigate: (props: Record<string, unknown>) => {
      mockNavigate(props)
      return null
    },
  }
})

import { useAuth } from '../../store/authStore'
const mockUseAuth = vi.mocked(useAuth)

describe('RequireAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders spinner when isLoading=true', () => {
    mockUseAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      isAdmin: false,
      user: null,
    } as ReturnType<typeof useAuth>)

    const { container } = renderWithProviders(
      <RequireAdmin><div>Admin Panel</div></RequireAdmin>
    )

    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()
    const divs = container.querySelectorAll('div')
    expect(divs.length).toBeGreaterThanOrEqual(2) // outer wrapper + spinner circle
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates to /login when isAuthenticated=false', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      user: null,
    } as ReturnType<typeof useAuth>)

    renderWithProviders(
      <RequireAdmin><div>Admin Panel</div></RequireAdmin>
    )

    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/login', replace: true })
    )
  })

  it('renders children when isAdmin=true', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      isAdmin: true,
      user: { name: 'Admin', email: 'admin@test.com', role: 'ADMIN' },
    } as ReturnType<typeof useAuth>)

    renderWithProviders(
      <RequireAdmin><div>Admin Panel</div></RequireAdmin>
    )

    expect(screen.getByText('Admin Panel')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('renders children when role=CONTENT_MOD (allowed)', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      user: { name: 'Moderator', email: 'mod@test.com', role: 'CONTENT_MOD' },
    } as ReturnType<typeof useAuth>)

    renderWithProviders(
      <RequireAdmin><div>Admin Panel</div></RequireAdmin>
    )

    expect(screen.getByText('Admin Panel')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates to / when authenticated but not admin or content_mod', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      user: { name: 'User', email: 'user@test.com', role: 'USER' },
    } as ReturnType<typeof useAuth>)

    renderWithProviders(
      <RequireAdmin><div>Admin Panel</div></RequireAdmin>
    )

    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/', replace: true })
    )
  })

  it('preserves location state when redirecting to /login', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      user: null,
    } as ReturnType<typeof useAuth>)

    renderWithProviders(
      <RequireAdmin><div>Admin Panel</div></RequireAdmin>
    )

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/login',
        state: expect.objectContaining({ from: expect.any(Object) }),
      })
    )
  })

  it('navigates to / (not /login) when authenticated but not authorized', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      user: { name: 'User', email: 'user@test.com', role: 'USER' },
    } as ReturnType<typeof useAuth>)

    renderWithProviders(
      <RequireAdmin><div>Admin Panel</div></RequireAdmin>
    )

    // Should redirect to home, NOT to login
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/' })
    )
    expect(mockNavigate).not.toHaveBeenCalledWith(
      expect.objectContaining({ to: '/login' })
    )
  })

  it('loading spinner renders with correct structure', () => {
    mockUseAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      isAdmin: false,
      user: null,
    } as ReturnType<typeof useAuth>)

    const { container } = renderWithProviders(
      <RequireAdmin><div>Admin Panel</div></RequireAdmin>
    )

    const html = container.innerHTML
    expect(html).toContain('min-height')
    expect(html).toContain('100vh')
    expect(html).toContain('border-radius')
    expect(html).toContain('32px')
    expect(html).toContain('spin')

    // Should not redirect while loading
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
