import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const mockApiGet = vi.fn()
vi.mock('../../../api/client', () => ({ api: { get: (...a: any[]) => mockApiGet(...a), patch: vi.fn(), delete: vi.fn() } }))

import GroupsAdmin from '../Groups'

describe('Groups Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockResolvedValue({ data: [
      { id: 'g1', name: 'Nhóm Test', code: 'ABC123', memberCount: 15, maxMembers: 200, isPublic: true, isLocked: false, leaderName: 'Leader 1' },
      { id: 'g2', name: 'Nhóm Khóa', code: 'XYZ789', memberCount: 5, maxMembers: 200, isPublic: false, isLocked: true, lockReason: 'Vi phạm nội quy', leaderName: 'Leader 2' },
    ] })
  })

  it('renders group list', async () => {
    render(<GroupsAdmin />)
    await waitFor(() => { expect(screen.getByText('Nhóm Test')).toBeInTheDocument() })
  })

  it('shows locked badge', async () => {
    render(<GroupsAdmin />)
    await waitFor(() => { expect(screen.getAllByText(/Khóa/).length).toBeGreaterThanOrEqual(1) })
  })

  it('shows group count', async () => {
    render(<GroupsAdmin />)
    await waitFor(() => { expect(screen.getByText(/2 nhóm/)).toBeInTheDocument() })
  })

  it('shows empty state', async () => {
    mockApiGet.mockResolvedValue({ data: [] })
    render(<GroupsAdmin />)
    await waitFor(() => { expect(screen.getByText(/Chưa có nhóm/)).toBeInTheDocument() })
  })

  it('handles error', () => {
    mockApiGet.mockRejectedValue(new Error('Network'))
    expect(() => render(<GroupsAdmin />)).not.toThrow()
  })
})
