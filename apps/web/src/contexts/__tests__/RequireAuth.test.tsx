import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../test/test-utils'
import RequireAuth from '../RequireAuth'

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

describe('RequireAuth', () => {
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
      <RequireAuth><div>Protected</div></RequireAuth>
    )

    expect(screen.queryByText('Protected')).not.toBeInTheDocument()
    // Spinner container — check that a loading div is rendered (not children, not navigate)
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
      <RequireAuth><div>Protected</div></RequireAuth>
    )

    expect(screen.queryByText('Protected')).not.toBeInTheDocument()
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '/login', replace: true })
    )
  })

  it('renders children when isAuthenticated=true', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      user: { name: 'Test', email: 'test@test.com' },
    } as ReturnType<typeof useAuth>)

    renderWithProviders(
      <RequireAuth><div>Protected Content</div></RequireAuth>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('preserves location state when redirecting to /login', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      user: null,
    } as ReturnType<typeof useAuth>)

    renderWithProviders(
      <RequireAuth><div>Protected</div></RequireAuth>
    )

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        state: expect.objectContaining({ from: expect.any(Object) }),
      })
    )
  })

  it('does not redirect while loading', () => {
    mockUseAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      isAdmin: false,
      user: null,
    } as ReturnType<typeof useAuth>)

    renderWithProviders(
      <RequireAuth><div>Protected</div></RequireAuth>
    )

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(screen.queryByText('Protected')).not.toBeInTheDocument()
  })

  it('renders the correct children component', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      isAdmin: false,
      user: { name: 'Test', email: 'test@test.com' },
    } as ReturnType<typeof useAuth>)

    renderWithProviders(
      <RequireAuth>
        <div data-testid="child-component">My Dashboard</div>
      </RequireAuth>
    )

    expect(screen.getByTestId('child-component')).toBeInTheDocument()
    expect(screen.getByText('My Dashboard')).toBeInTheDocument()
  })

  it('loading spinner has correct styles (centered, full height)', () => {
    mockUseAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      isAdmin: false,
      user: null,
    } as ReturnType<typeof useAuth>)

    const { container } = renderWithProviders(
      <RequireAuth><div>Protected</div></RequireAuth>
    )

    // The component renders two nested divs: outer (centering) + inner (spinner circle)
    const html = container.innerHTML
    expect(html).toContain('min-height')
    expect(html).toContain('100vh')
    expect(html).toContain('border-radius')
    expect(html).toContain('32px')
    // Ensure spinner animation is present
    expect(html).toContain('spin')
  })

  it('Navigate has replace=true to avoid back-button loop', () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      isAdmin: false,
      user: null,
    } as ReturnType<typeof useAuth>)

    renderWithProviders(
      <RequireAuth><div>Protected</div></RequireAuth>
    )

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({ replace: true })
    )
  })
})
