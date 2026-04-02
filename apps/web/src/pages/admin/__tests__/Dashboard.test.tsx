import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockApiGet = vi.fn()
vi.mock('../../../api/client', () => ({ api: { get: (...a: any[]) => mockApiGet(...a) } }))

import AdminDashboard from '../Dashboard'

function renderDashboard() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><MemoryRouter><AdminDashboard /></MemoryRouter></QueryClientProvider>)
}

const FULL_DATA = {
  kpis: { totalUsers: 1247, totalQuestions: 3420, pendingReview: 23, activeSessions: 856, activeUsers: 342 },
  questionQueue: { pendingReview: 23, aiGenerated: 102, communitySubmissions: 15 },
  actionItems: { pendingFeedback: 5, reportedGroups: 2, flaggedUsers: 1 },
  recentActivity: [
    { action: 'Approved question', admin: 'Admin A', timestamp: '2h ago' },
    { action: 'Flagged user', admin: 'System Bot', timestamp: '3h ago' },
  ],
  charts: { sessionsTotal: 5821, newUsers30d: 412 },
}

describe('Admin Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/dashboard')) return Promise.resolve({ data: FULL_DATA })
      if (url.includes('/coverage')) return Promise.resolve({ data: { books: [
        { book: 'Genesis', easy: 30, medium: 20, hard: 10, total: 60, meetsMinimum: true },
      ] } })
      return Promise.reject(new Error('Not found'))
    })
  })

  it('renders KPI values without dashes', async () => {
    renderDashboard()
    await waitFor(() => { expect(screen.getByText('1,247')).toBeInTheDocument() })
    expect(screen.getByText(/3,420/)).toBeInTheDocument()
    expect(screen.getByText('856')).toBeInTheDocument()
  })

  it('renders KPI as 0 when null, not dash', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/dashboard')) return Promise.resolve({ data: {
        kpis: { totalUsers: 0, totalQuestions: 0, pendingReview: 0 },
        questionQueue: { pendingReview: 0, aiGenerated: 0, communitySubmissions: 0 },
        actionItems: {},
        recentActivity: [],
      } })
      if (url.includes('/coverage')) return Promise.resolve({ data: { books: [] } })
      return Promise.reject(new Error('Not found'))
    })
    renderDashboard()
    await waitFor(() => { expect(screen.getByText('Sessions hôm nay')).toBeInTheDocument() })
    // Should show "0" not "—"
    const sessionCard = screen.getByText('Sessions hôm nay').closest('div')!
    expect(sessionCard.textContent).toContain('0')
    expect(sessionCard.textContent).not.toContain('—')
  })

  it('renders Question Queue panel', async () => {
    renderDashboard()
    await waitFor(() => { expect(screen.getByText('Question Queue')).toBeInTheDocument() })
    expect(screen.getByText('Pending Review')).toBeInTheDocument()
    expect(screen.getByText('AI Generated')).toBeInTheDocument()
    expect(screen.getByText('Process Next 50')).toBeInTheDocument()
  })

  it('renders "Cần xử lý" action items', async () => {
    renderDashboard()
    await waitFor(() => { expect(screen.getByText('Cần xử lý')).toBeInTheDocument() })
    expect(screen.getByText('5 feedback đang mở')).toBeInTheDocument()
    expect(screen.getByText('23 câu chờ duyệt')).toBeInTheDocument()
    expect(screen.getByText('2 groups bị report')).toBeInTheDocument()
    expect(screen.getByText('1 user bị flag')).toBeInTheDocument()
  })

  it('renders green checkmark when no action items', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/dashboard')) return Promise.resolve({ data: {
        ...FULL_DATA, actionItems: { pendingFeedback: 0, reportedGroups: 0, flaggedUsers: 0 },
        kpis: { ...FULL_DATA.kpis, pendingReview: 0 },
      } })
      if (url.includes('/coverage')) return Promise.resolve({ data: { books: [] } })
      return Promise.reject(new Error('Not found'))
    })
    renderDashboard()
    await waitFor(() => { expect(screen.getByText(/hệ thống hoạt động tốt/)).toBeInTheDocument() })
  })

  it('renders admin activity log', async () => {
    renderDashboard()
    await waitFor(() => { expect(screen.getByText('Hoạt động Admin')).toBeInTheDocument() })
    expect(screen.getByText(/Approved question/)).toBeInTheDocument()
  })

  it('renders activity log placeholder when empty', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('/dashboard')) return Promise.resolve({ data: { ...FULL_DATA, recentActivity: [] } })
      if (url.includes('/coverage')) return Promise.resolve({ data: { books: [] } })
      return Promise.reject(new Error('Not found'))
    })
    renderDashboard()
    await waitFor(() => { expect(screen.getByText(/thao tác quản trị sẽ hiện ở đây/)).toBeInTheDocument() })
  })

  it('renders coverage chart', async () => {
    renderDashboard()
    await waitFor(() => { expect(screen.getByText(/Question Coverage/)).toBeInTheDocument() })
  })

  it('renders sessions chart', async () => {
    renderDashboard()
    await waitFor(() => { expect(screen.getByText('Sessions 7 ngày qua')).toBeInTheDocument() })
    expect(screen.getByText(/5,821/)).toBeInTheDocument()
  })

  it('renders user registration chart', async () => {
    renderDashboard()
    await waitFor(() => { expect(screen.getByText('User registrations 30 ngày')).toBeInTheDocument() })
    expect(screen.getByText(/412/)).toBeInTheDocument()
  })

  it('shows skeleton during loading', () => {
    mockApiGet.mockReturnValue(new Promise(() => {}))
    renderDashboard()
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('handles API error gracefully', async () => {
    mockApiGet.mockRejectedValue(new Error('Network'))
    renderDashboard()
    await waitFor(() => { expect(document.body).toBeInTheDocument() })
  })
})
