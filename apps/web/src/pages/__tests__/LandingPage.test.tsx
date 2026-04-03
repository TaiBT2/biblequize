import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

/**
 * Tests for the Guest Landing Page.
 * Covers: rendering sections, auth redirect, navigation links.
 */

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

let authState = { isAuthenticated: false, isLoading: false, user: null as any }
vi.mock('../../store/authStore', () => ({
  useAuthStore: (selector?: (s: any) => any) => selector ? selector(authState) : authState,
}))

import LandingPage from '../LandingPage'

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  )
}

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authState = { isAuthenticated: false, isLoading: false, user: null }
  })

  it('renders hero section with headline', () => {
    renderLanding()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Học Kinh Thánh/i)
  })

  it('renders "Chơi Thử Ngay" CTA button', () => {
    renderLanding()
    expect(screen.getByText(/Chơi Thử Ngay/i)).toBeInTheDocument()
  })

  it('renders features grid section', () => {
    renderLanding()
    expect(screen.getByText(/6 Chế Độ Chơi/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Nhóm Hội Thánh/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders leaderboard preview section', () => {
    renderLanding()
    expect(screen.getByText(/Bảng Xếp Hạng Toàn Quốc/i)).toBeInTheDocument()
  })

  it('renders daily verse section', () => {
    renderLanding()
    expect(screen.getByText(/Lời Chúa là ngọn đèn/i)).toBeInTheDocument()
  })

  it('renders footer with BibleQuiz branding', () => {
    renderLanding()
    const footerBrand = screen.getAllByText('BibleQuiz')
    expect(footerBrand.length).toBeGreaterThanOrEqual(1)
  })

  it('renders navigation with Login and Register', () => {
    renderLanding()
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Register')).toBeInTheDocument()
  })

  it('redirects to / when user is already authenticated', () => {
    authState = {
      isAuthenticated: true,
      isLoading: false,
      user: { name: 'Test', email: 'test@test.com' },
    }
    renderLanding()

    expect(mockNavigate).toHaveBeenCalledWith('/', expect.anything())
  })

  it('does NOT redirect when user is not authenticated', () => {
    authState = { isAuthenticated: false, isLoading: false, user: null }
    renderLanding()

    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
