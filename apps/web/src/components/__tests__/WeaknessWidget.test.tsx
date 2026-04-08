import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'

const mockApiGet = vi.fn()
vi.mock('../../api/client', () => ({
  api: { get: (...args: any[]) => mockApiGet(...args) },
}))

import WeaknessWidget from '../WeaknessWidget'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
)

describe('WeaknessWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders strong and weak books', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        weakBooks: [
          { book: 'Rô-ma', totalAnswered: 10, correct: 4, wrong: 6, accuracy: 40.0 },
        ],
        strongBooks: [
          { book: 'Giăng', totalAnswered: 20, correct: 19, wrong: 1, accuracy: 95.0 },
        ],
        suggestedPractice: 'Rô-ma',
      },
    })

    render(<WeaknessWidget />, { wrapper })

    await vi.waitFor(() => {
      expect(screen.getByText('Giăng')).toBeInTheDocument()
      expect(screen.getByText('95%')).toBeInTheDocument()
      expect(screen.getByText('Rô-ma')).toBeInTheDocument()
      expect(screen.getByText('40%')).toBeInTheDocument()
    })
  })

  it('shows practice suggestion', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        weakBooks: [{ book: 'Lê-vi Ký', totalAnswered: 8, correct: 3, wrong: 5, accuracy: 37.5 }],
        strongBooks: [],
        suggestedPractice: 'Lê-vi Ký',
      },
    })

    render(<WeaknessWidget />, { wrapper })

    await vi.waitFor(() => {
      expect(screen.getByText(/Ôn Lê-vi Ký ngay/)).toBeInTheDocument()
    })
  })

  it('renders nothing when no data', async () => {
    mockApiGet.mockResolvedValue({
      data: { weakBooks: [], strongBooks: [], suggestedPractice: null },
    })

    const { container } = render(<WeaknessWidget />, { wrapper })
    await new Promise(r => setTimeout(r, 100))
    expect(container.innerHTML).toBe('')
  })

  it('does not crash on API error', async () => {
    mockApiGet.mockRejectedValue(new Error('Network'))
    const { container } = render(<WeaknessWidget />, { wrapper })
    await new Promise(r => setTimeout(r, 100))
    expect(container.innerHTML).toBe('')
  })
})
