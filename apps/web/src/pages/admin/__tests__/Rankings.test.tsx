import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const mockApiGet = vi.fn()
const mockApiPost = vi.fn()
vi.mock('../../../api/client', () => ({ api: { get: (...a: any[]) => mockApiGet(...a), post: (...a: any[]) => mockApiPost(...a) } }))

import RankingsAdmin from '../Rankings'

describe('Rankings Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockResolvedValue({ data: [
      { id: 's1', name: 'Mùa Phục Sinh', startDate: '2026-01-01', endDate: '2026-03-31', isActive: true },
      { id: 's2', name: 'Mùa Giáng Sinh', startDate: '2025-10-01', endDate: '2025-12-31', isActive: false },
    ] })
  })

  it('renders season list', async () => {
    render(<RankingsAdmin />)
    await waitFor(() => { expect(screen.getByText('Mùa Phục Sinh')).toBeInTheDocument() })
  })

  it('shows active season highlighted', async () => {
    render(<RankingsAdmin />)
    await waitFor(() => { expect(screen.getByText('Đang diễn ra')).toBeInTheDocument() })
  })

  it('renders create button', () => {
    render(<RankingsAdmin />)
    expect(screen.getByText('+ Tạo mùa mới')).toBeInTheDocument()
  })

  it('shows season count', async () => {
    render(<RankingsAdmin />)
    await waitFor(() => { expect(screen.getByText(/2 seasons/)).toBeInTheDocument() })
  })

  it('handles API error', () => {
    mockApiGet.mockRejectedValue(new Error('Network'))
    expect(() => render(<RankingsAdmin />)).not.toThrow()
  })
})
