import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const mockApiGet = vi.fn()
const mockApiPatch = vi.fn()
vi.mock('../../../api/client', () => ({ api: { get: (...a: any[]) => mockApiGet(...a), patch: (...a: any[]) => mockApiPatch(...a) } }))

import UsersAdmin from '../Users'

describe('Users Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockResolvedValue({ data: {
      items: [
        { id: 'u1', name: 'Test User', email: 'test@test.com', role: 'USER', currentStreak: 5, longestStreak: 10, isBanned: false },
        { id: 'u2', name: 'Admin User', email: 'admin@test.com', role: 'ADMIN', currentStreak: 0, longestStreak: 0, isBanned: false },
      ],
      total: 2, page: 0, totalPages: 1,
    } })
  })

  it('renders user list', async () => {
    render(<UsersAdmin />)
    await waitFor(() => { expect(screen.getByText('Test User')).toBeInTheDocument() })
  })

  it('displays page title', async () => {
    render(<UsersAdmin />)
    expect(screen.getByText('Quản lý người dùng')).toBeInTheDocument()
  })

  it('renders search input', () => {
    render(<UsersAdmin />)
    expect(screen.getByPlaceholderText(/Tìm theo tên/)).toBeInTheDocument()
  })

  it('renders role filter', () => {
    render(<UsersAdmin />)
    expect(screen.getByText('Role (All)')).toBeInTheDocument()
  })

  it('shows role badges', async () => {
    render(<UsersAdmin />)
    await waitFor(() => {
      expect(screen.getByText('USER')).toBeInTheDocument()
      expect(screen.getByText('ADMIN')).toBeInTheDocument()
    })
  })

  it('handles API error', () => {
    mockApiGet.mockRejectedValue(new Error('Network'))
    expect(() => render(<UsersAdmin />)).not.toThrow()
  })

  it('shows empty state', async () => {
    mockApiGet.mockResolvedValue({ data: { items: [], total: 0, page: 0, totalPages: 0 } })
    render(<UsersAdmin />)
    await waitFor(() => { expect(screen.getByText(/Không tìm thấy/)).toBeInTheDocument() })
  })
})
