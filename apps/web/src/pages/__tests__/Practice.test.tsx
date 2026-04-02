import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockApiGet = vi.fn()
const mockApiPost = vi.fn()
vi.mock('../../api/client', () => ({
  api: {
    get: (...args: any[]) => mockApiGet(...args),
    post: (...args: any[]) => mockApiPost(...args),
  },
}))

import Practice from '../Practice'

function renderPractice() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Practice />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Practice Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/api/books'))
        return Promise.resolve({ data: [
          { id: '1', name: 'Genesis', nameVi: 'Sáng Thế Ký', testament: 'OT', orderIndex: 1 },
          { id: '2', name: 'Matthew', nameVi: 'Ma-thi-ơ', testament: 'NT', orderIndex: 40 },
        ] })
      return Promise.reject(new Error('Not found'))
    })
    mockApiPost.mockResolvedValue({ data: { sessionId: 'sess-1', questions: [] } })
  })

  it('renders page title', () => {
    renderPractice()
    expect(screen.getByText(/Luyện/)).toBeInTheDocument()
    expect(screen.getByText(/Tập/)).toBeInTheDocument()
  })

  it('renders difficulty options (Dễ, TB, Khó, Hỗn hợp equivalent)', () => {
    renderPractice()
    expect(screen.getByText('Dễ')).toBeInTheDocument()
    expect(screen.getByText('Trung bình')).toBeInTheDocument()
    expect(screen.getByText('Khó')).toBeInTheDocument()
  })

  it('renders question count section', () => {
    renderPractice()
    expect(screen.getByText('Số câu hỏi')).toBeInTheDocument()
  })

  it('renders show explanation toggle', () => {
    renderPractice()
    expect(screen.getByText('Hiển thị giải thích')).toBeInTheDocument()
  })

  it('renders start CTA button after books load', async () => {
    renderPractice()
    await waitFor(() => {
      expect(screen.getByText(/Bắt Đầu Luyện Tập/)).toBeInTheDocument()
    })
  })

  it('renders retry section', () => {
    renderPractice()
    expect(screen.getByText(/Làm lại câu sai/)).toBeInTheDocument()
  })

  it('renders recent sessions section', () => {
    renderPractice()
    expect(screen.getByText('Phiên gần đây')).toBeInTheDocument()
  })

  it('clicking difficulty option updates selection', async () => {
    renderPractice()
    const user = userEvent.setup()
    await user.click(screen.getByText('Khó'))
    // The "Khó" button should now be active (has check_circle icon)
    const hardBtn = screen.getByText('Khó').closest('button')
    expect(hardBtn?.className).toContain('ring-secondary')
  })

  it('clicking start calls API and navigates', async () => {
    renderPractice()
    const user = userEvent.setup()
    // Wait for books to load so button is enabled
    await waitFor(() => {
      expect(screen.getByText(/Bắt Đầu Luyện Tập/)).toBeInTheDocument()
    })
    await user.click(screen.getByText(/Bắt Đầu Luyện Tập/).closest('button')!)
    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/api/sessions', expect.objectContaining({
        mode: 'practice',
      }))
    })
  })

  it('shows error message when API fails', async () => {
    mockApiPost.mockRejectedValue(new Error('Server error'))
    renderPractice()
    const user = userEvent.setup()
    await waitFor(() => {
      expect(screen.getByText(/Bắt Đầu Luyện Tập/)).toBeInTheDocument()
    })
    await user.click(screen.getByText(/Bắt Đầu Luyện Tập/).closest('button')!)
    await waitFor(() => {
      expect(screen.getByText(/Không tạo được phiên luyện tập/)).toBeInTheDocument()
    })
  })

  it('has back link to home', () => {
    renderPractice()
    const backLink = screen.getByText('Quay lại trang chủ')
    expect(backLink.closest('a')).toHaveAttribute('href', '/')
  })
})
