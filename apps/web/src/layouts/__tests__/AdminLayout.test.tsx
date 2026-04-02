import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({ user: { name: 'Admin', role: 'ADMIN' }, logout: vi.fn() }),
}))

import AdminLayout from '../AdminLayout'

function renderLayout(route = '/admin') {
  return render(<MemoryRouter initialEntries={[route]}><AdminLayout /></MemoryRouter>)
}

describe('AdminLayout', () => {
  it('renders branding', () => {
    renderLayout()
    expect(screen.getByText('BIBLEQUIZ')).toBeInTheDocument()
    expect(screen.getByText('Admin Panel')).toBeInTheDocument()
  })

  it('renders all 13 nav items', () => {
    renderLayout()
    const items = ['Users', 'Questions', 'AI Generator', 'Review Queue',
      'Feedback', 'Seasons & Rankings', 'Events & Tournaments', 'Groups',
      'Configuration', 'Export Center', 'Question Quality']
    for (const item of items) {
      expect(screen.getByText(item)).toBeInTheDocument()
    }
    // Dashboard appears in both nav and TopNavBar h1
    expect(screen.getAllByText('Dashboard')).toHaveLength(2)
    // Notifications appears in both nav and TopNavBar bell icon
    expect(screen.getAllByText('Notifications')).toHaveLength(1)
  })

  it('renders TopNavBar with page title and search', () => {
    renderLayout()
    expect(screen.getByPlaceholderText('Search analytics or logs...')).toBeInTheDocument()
    expect(screen.getByText('New Quiz')).toBeInTheDocument()
    expect(screen.getByText('history')).toBeInTheDocument()
  })

  it('renders "Về trang chính" link', () => {
    renderLayout()
    const link = screen.getByText('Về trang chính')
    expect(link.closest('a')).toHaveAttribute('href', '/')
  })

  it('renders user info in sidebar', () => {
    renderLayout()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })

  it('renders logout button', () => {
    renderLayout()
    expect(screen.getByText('logout')).toBeInTheDocument()
  })
})
