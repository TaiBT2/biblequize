import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const mockApiGet = vi.fn()
vi.mock('../../../api/client', () => ({ api: { get: (...a: any[]) => mockApiGet(...a) } }))

import EventsAdmin from '../Events'

describe('Events Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockResolvedValue({ data: [
      { tournamentId: 't1', name: 'Tournament 1', bracketSize: 8, status: 'IN_PROGRESS', currentRound: 2, totalRounds: 3 },
    ] })
  })

  it('renders tournament list', async () => {
    render(<EventsAdmin />)
    await waitFor(() => { expect(screen.getByText('Tournament 1')).toBeInTheDocument() })
  })

  it('shows status badge', async () => {
    render(<EventsAdmin />)
    await waitFor(() => { expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument() })
  })

  it('shows empty state', async () => {
    mockApiGet.mockResolvedValue({ data: [] })
    render(<EventsAdmin />)
    await waitFor(() => { expect(screen.getByText(/Chưa có tournament/)).toBeInTheDocument() })
  })

  it('handles error', () => {
    mockApiGet.mockRejectedValue(new Error('Network'))
    expect(() => render(<EventsAdmin />)).not.toThrow()
  })
})
