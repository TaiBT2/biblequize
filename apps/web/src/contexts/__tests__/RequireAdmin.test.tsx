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

  it('renders loading spinner via role="progressbar" when isLoading=true', () => {
    mockUseAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      isAdmin: false,
      user: null,
    } as ReturnType<typeof useAuth>)

    renderWithProviders(
      <RequireAdmin><div>Admin Panel</div></RequireAdmin>
    )

    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByTestId('admin-loading')).toBeInTheDocument()
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()
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

  it('renders children when role=CONTENT_MOD uppercase (allowed)', () => {
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

  it('rejects content_mod lowercase — role must be normalized upstream', () => {
    // After code review fix CR-7, authStore normalizes role to uppercase.
    // If somehow a lowercase role leaks through, RequireAdmin should reject it
    // because the check is now strict: user?.role === 'CONTENT_MOD'.
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      user: { name: 'Moderator', email: 'mod@test.com', role: 'content_mod' },
    } as ReturnType<typeof useAuth>)

    renderWithProviders(
      <RequireAdmin><div>Admin Panel</div></RequireAdmin>
    )

    // Lowercase content_mod is NOT recognized — redirects to /
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/' })
    )
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

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/' })
    )
    expect(mockNavigate).not.toHaveBeenCalledWith(
      expect.objectContaining({ to: '/login' })
    )
  })

  it('loading spinner has full-height centering container', () => {
    mockUseAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      isAdmin: false,
      user: null,
    } as ReturnType<typeof useAuth>)

    renderWithProviders(
      <RequireAdmin><div>Admin Panel</div></RequireAdmin>
    )

    const container = screen.getByTestId('admin-loading')
    expect(container.style.minHeight).toBe('100vh')
    expect(container.style.display).toBe('flex')

    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner.style.width).toBe('32px')
    expect(spinner.style.borderRadius).toBe('50%')
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
