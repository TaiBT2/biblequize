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

  it('renders the 7 core + Tier B nav items', () => {
    renderLayout()
    const items = ['Users', 'Questions', 'AI Generator', 'Review Queue',
      'Feedback', 'Groups']
    for (const item of items) {
      expect(screen.getByText(item)).toBeInTheDocument()
    }
    // Dashboard appears in both nav and TopNavBar h1
    expect(screen.getAllByText('Dashboard')).toHaveLength(2)
  })

  it('hides Tier C nav items (ADM-1)', () => {
    renderLayout()
    const hidden = ['Seasons & Rankings', 'Events & Tournaments', 'Notifications',
      'Configuration', 'Export Center', 'Question Quality', 'Early Unlock']
    for (const item of hidden) {
      expect(screen.queryByText(item)).not.toBeInTheDocument()
    }
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
