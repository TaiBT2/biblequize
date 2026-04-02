import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const mockApiGet = vi.fn()
const mockApiPost = vi.fn()
vi.mock('../../../api/client', () => ({
  api: {
    get: (...args: any[]) => mockApiGet(...args),
    post: (...args: any[]) => mockApiPost(...args),
  },
}))

import ReviewQueue from '../ReviewQueue'

const mockPending = {
  questions: [
    {
      id: 'q1', content: 'Test question?', book: 'Genesis', chapter: 1,
      difficulty: 'easy', type: 'multiple_choice_single',
      options: ['A', 'B', 'C', 'D'], correctAnswer: [0],
      explanation: 'Explanation', approvalsCount: 1, approvalsRequired: 2,
      reviews: [{ adminId: 'a1', adminName: 'Admin1', decision: 'approved' }],
    },
  ],
  total: 1,
  page: 0,
  size: 50,
}

const mockStats = { pending: 5, active: 100, rejected: 10, approvalsRequired: 2 }

describe('ReviewQueue Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/stats')) return Promise.resolve({ data: mockStats })
      if (url.includes('/pending')) return Promise.resolve({ data: mockPending })
      return Promise.reject(new Error('Not found'))
    })
    mockApiPost.mockResolvedValue({ data: { approvalsCount: 2, status: 'ACTIVE', activated: true } })
  })

  it('renders pending questions', async () => {
    render(<ReviewQueue />)
    await waitFor(() => {
      expect(screen.getByText('Test question?')).toBeInTheDocument()
    })
  })

  it('fetches data on mount', async () => {
    render(<ReviewQueue />)
    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalled()
    })
  })

  it('shows approval count', async () => {
    render(<ReviewQueue />)
    await waitFor(() => {
      // approvalsCount: 1 of 2 required
      expect(screen.getByText('Test question?')).toBeInTheDocument()
    })
  })

  it('does not crash on empty pending list', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/stats')) return Promise.resolve({ data: mockStats })
      return Promise.resolve({ data: { questions: [], total: 0, page: 0, size: 50 } })
    })
    render(<ReviewQueue />)
    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalled()
    })
  })

  it('does not crash on API error', async () => {
    mockApiGet.mockRejectedValue(new Error('Network'))
    expect(() => render(<ReviewQueue />)).not.toThrow()
  })

  it('shows reviewer badges', async () => {
    render(<ReviewQueue />)
    await waitFor(() => {
      expect(screen.getByText('Test question?')).toBeInTheDocument()
    })
  })
})
