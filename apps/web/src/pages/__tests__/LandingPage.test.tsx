import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

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
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Học Kinh Thánh|Learn the Bible/i)
  })

  it('renders CTA button', () => {
    renderLanding()
    expect(screen.getByText(/Chơi Thử Ngay|Try Now/i)).toBeInTheDocument()
  })

  it('renders features grid section', () => {
    renderLanding()
    expect(screen.getByText(/6 Chế Độ Chơi|6 Game Modes/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Nhóm Hội Thánh|Church Groups/i).length).toBeGreaterThanOrEqual(1)
  })

  it('renders leaderboard preview section', () => {
    renderLanding()
    expect(screen.getByText(/Bảng Xếp Hạng Toàn Quốc|National Leaderboard/i)).toBeInTheDocument()
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

  it('renders navigation with auth links', () => {
    renderLanding()
    // Auth text varies by language (Đăng nhập / Log In)
    expect(screen.getAllByText(/Đăng nhập|Log In/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Đăng ký|Register/i).length).toBeGreaterThanOrEqual(1)
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
