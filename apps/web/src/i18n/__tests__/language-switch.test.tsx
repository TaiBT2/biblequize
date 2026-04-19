import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithI18n } from '../../test/i18n-test-utils'
import i18n from '../index'
import Header from '../../components/Header'

// Mock auth so Header renders the authenticated shell without needing a store
vi.mock('../../store/authStore', () => ({
  useAuth: () => ({
    user: { name: 'Tester', email: 't@ex.com' },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
  useAuthStore: () => ({
    user: { name: 'Tester', email: 't@ex.com' },
    isAuthenticated: true,
    logout: vi.fn(),
  }),
}))

// Silence the axios interceptor that setups up auth; no network calls in these tests
vi.mock('../../api/client', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: { notifications: [], unreadCount: 0 } }),
    patch: vi.fn().mockResolvedValue({}),
  },
}))

describe('i18n language switch mid-session', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('vi')
  })

  afterEach(async () => {
    await i18n.changeLanguage('vi')
  })

  it('renders Vietnamese nav labels when language is vi', () => {
    renderWithI18n(<Header />, { language: 'vi' })
    expect(screen.getByText('Trang chủ')).toBeInTheDocument()
    expect(screen.getByText('Hằng ngày')).toBeInTheDocument()
    expect(screen.getByText('Leo Rank')).toBeInTheDocument()
  })

  it('swaps to English nav labels after i18n.changeLanguage("en")', async () => {
    renderWithI18n(<Header />, { language: 'vi' })
    expect(screen.getByText('Trang chủ')).toBeInTheDocument()

    await i18n.changeLanguage('en')

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Daily')).toBeInTheDocument()
      expect(screen.getByText('Ranked')).toBeInTheDocument()
    })
    // Vietnamese labels should be gone
    expect(screen.queryByText('Trang chủ')).not.toBeInTheDocument()
    expect(screen.queryByText('Leo Rank')).not.toBeInTheDocument()
  })

  it('round-trips vi → en → vi and recovers the original labels', async () => {
    renderWithI18n(<Header />, { language: 'vi' })
    expect(screen.getByText('Trang chủ')).toBeInTheDocument()

    await i18n.changeLanguage('en')
    await waitFor(() => expect(screen.getByText('Home')).toBeInTheDocument())

    await i18n.changeLanguage('vi')
    await waitFor(() => {
      expect(screen.getByText('Trang chủ')).toBeInTheDocument()
      expect(screen.queryByText('Home')).not.toBeInTheDocument()
    })
  })

  it('i18n.language reflects the active locale', async () => {
    renderWithI18n(<Header />, { language: 'vi' })
    expect(i18n.language).toBe('vi')

    await i18n.changeLanguage('en')
    expect(i18n.language).toBe('en')

    await i18n.changeLanguage('vi')
    expect(i18n.language).toBe('vi')
  })

  it('time-ago interpolation updates with the active locale', async () => {
    await i18n.changeLanguage('vi')
    expect(i18n.t('header.time.minutesAgo', { count: 5 })).toBe('5 phút trước')

    await i18n.changeLanguage('en')
    expect(i18n.t('header.time.minutesAgo', { count: 5 })).toBe('5 min ago')
  })
})
