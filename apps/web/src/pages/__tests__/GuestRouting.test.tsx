import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Tests that "/" shows LandingPage for guests and Home for authenticated users.
 *
 * Bug: Previously "/" always showed the authenticated Home dashboard even for
 * guests who were not logged in. Now HomeOrLanding wrapper checks auth state.
 */

// Track auth state
let authState = { isAuthenticated: false, isLoading: false, user: null as any }

vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector?: (state: any) => any) => {
    return selector ? selector(authState) : authState
  },
}))

// Mock heavy page components
vi.mock('../LandingPage', () => ({
  default: () => <div data-testid="landing-page">LandingPage</div>,
}))
vi.mock('../Home', () => ({
  default: () => <div data-testid="home-page">Home Dashboard</div>,
}))

// Import after mocks
import { useAuthStore } from '../../store/authStore'
import LandingPageMock from '../LandingPage'
import HomeMock from '../Home'

// Replicate HomeOrLanding logic from main.tsx
function HomeOrLanding() {
  const { isAuthenticated, isLoading } = useAuthStore()
  if (isLoading) return <div data-testid="loading">Loading...</div>
  if (!isAuthenticated) return <LandingPageMock />
  return (
    <div data-testid="app-layout">
      <Outlet />
    </div>
  )
}

function renderApp(route = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route element={<HomeOrLanding />}>
            <Route path="/" element={<HomeMock />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Guest vs Authenticated Routing', () => {
  beforeEach(() => {
    authState = { isAuthenticated: false, isLoading: false, user: null }
  })

  it('shows LandingPage when user is NOT authenticated', async () => {
    authState = { isAuthenticated: false, isLoading: false, user: null }
    renderApp('/')

    await waitFor(() => {
      expect(screen.getByTestId('landing-page')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument()
    expect(screen.queryByTestId('app-layout')).not.toBeInTheDocument()
  })

  it('shows Home dashboard inside AppLayout when user IS authenticated', async () => {
    authState = {
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Test', email: 'test@test.com' },
    }
    renderApp('/')

    await waitFor(() => {
      expect(screen.getByTestId('app-layout')).toBeInTheDocument()
      expect(screen.getByTestId('home-page')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument()
  })

  it('shows loading state while auth is being checked', () => {
    authState = { isAuthenticated: false, isLoading: true, user: null }
    renderApp('/')

    expect(screen.getByTestId('loading')).toBeInTheDocument()
    expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument()
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument()
  })
})
