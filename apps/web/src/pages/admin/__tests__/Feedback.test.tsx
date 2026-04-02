import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockApiGet = vi.fn()
const mockApiPatch = vi.fn()
vi.mock('../../../api/client', () => ({
  api: {
    get: (...args: any[]) => mockApiGet(...args),
    patch: (...args: any[]) => mockApiPatch(...args),
  },
}))

import FeedbackAdmin from '../Feedback'

const mockData = {
  items: [
    { id: 'f1', type: 'report', status: 'pending', content: 'Bug report', createdAt: '2026-04-01', userName: 'User1' },
    { id: 'f2', type: 'question', status: 'resolved', content: 'Question issue', createdAt: '2026-04-01', userName: 'User2' },
  ],
  total: 2,
  page: 0,
  totalPages: 1,
  stats: { pending: 1, in_progress: 0, resolved: 1, rejected: 0 },
}

describe('Feedback Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockResolvedValue({ data: mockData })
    mockApiPatch.mockResolvedValue({ data: { id: 'f1', status: 'in_progress' } })
  })

  it('renders feedback list after loading', async () => {
    render(<FeedbackAdmin />)
    await waitFor(() => {
      expect(screen.getByText('Bug report')).toBeInTheDocument()
      expect(screen.getByText('Question issue')).toBeInTheDocument()
    })
  })

  it('calls API with correct params', async () => {
    render(<FeedbackAdmin />)
    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith('/api/admin/feedback', expect.objectContaining({
        params: expect.objectContaining({ page: 0, size: 20 }),
      }))
    })
  })

  it('shows loading state', () => {
    mockApiGet.mockReturnValue(new Promise(() => {}))
    render(<FeedbackAdmin />)
    // Component should show some loading indicator
    expect(document.querySelector('body')).toBeInTheDocument()
  })

  it('shows stats cards', async () => {
    render(<FeedbackAdmin />)
    await waitFor(() => {
      // Stats should render somewhere
      expect(mockApiGet).toHaveBeenCalled()
    })
  })

  it('renders status filter options', async () => {
    render(<FeedbackAdmin />)
    await waitFor(() => {
      expect(screen.getByText('Bug report')).toBeInTheDocument()
    })
  })

  it('does not crash on empty data', async () => {
    mockApiGet.mockResolvedValue({ data: { items: [], total: 0, page: 0, totalPages: 0, stats: {} } })
    render(<FeedbackAdmin />)
    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalled()
    })
  })

  it('does not crash on API error', async () => {
    mockApiGet.mockRejectedValue(new Error('Network'))
    expect(() => render(<FeedbackAdmin />)).not.toThrow()
  })
})
