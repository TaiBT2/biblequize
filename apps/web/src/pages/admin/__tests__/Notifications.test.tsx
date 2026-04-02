import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

const mockApiGet = vi.fn()
vi.mock('../../../api/client', () => ({ api: { get: (...a: any[]) => mockApiGet(...a) } }))

import NotificationsAdmin from '../Notifications'

describe('Notifications Admin', () => {
  beforeEach(() => { vi.clearAllMocks(); mockApiGet.mockResolvedValue({ data: [] }) })

  it('renders compose section', () => {
    render(<NotificationsAdmin />)
    expect(screen.getAllByText(/Gửi thông báo/).length).toBeGreaterThanOrEqual(1)
  })

  it('renders title input', () => {
    render(<NotificationsAdmin />)
    expect(screen.getByPlaceholderText(/Tiêu đề/)).toBeInTheDocument()
  })

  it('renders automated notifications', () => {
    render(<NotificationsAdmin />)
    expect(screen.getByText('Thông báo tự động')).toBeInTheDocument()
    expect(screen.getByText('Nhắc streak sắp gãy')).toBeInTheDocument()
  })

  it('renders history section', async () => {
    render(<NotificationsAdmin />)
    await waitFor(() => { expect(screen.getByText('Lịch sử thông báo')).toBeInTheDocument() })
  })

  it('send button disabled without content', () => {
    render(<NotificationsAdmin />)
    const btns = screen.getAllByText(/Gửi thông báo/)
    const sendBtn = btns.find(el => el.closest('button'))
    expect(sendBtn?.closest('button')).toBeDisabled()
  })
})
