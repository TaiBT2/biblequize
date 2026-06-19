import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PrivacySettings } from '../PrivacySettings'

const mockPatch = vi.fn(() => Promise.resolve({ data: {} }))
vi.mock('../../../api/client', () => ({
  api: { patch: (...args: any[]) => mockPatch(...args) },
}))

describe('PrivacySettings (LBF-5)', () => {
  beforeEach(() => mockPatch.mockClear())

  it('renders the leaderboard-visibility toggle ON when initialVisible', () => {
    render(<PrivacySettings initialVisible={true} />)
    expect(screen.getByTestId('leaderboard-visible-toggle')).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders OFF when opted out', () => {
    render(<PrivacySettings initialVisible={false} />)
    expect(screen.getByTestId('leaderboard-visible-toggle')).toHaveAttribute('aria-pressed', 'false')
  })

  it('PATCHes /api/me { leaderboardVisible: "false" } and flips when toggled off', async () => {
    render(<PrivacySettings initialVisible={true} />)
    fireEvent.click(screen.getByTestId('leaderboard-visible-toggle'))
    await waitFor(() =>
      expect(mockPatch).toHaveBeenCalledWith('/api/me', { leaderboardVisible: 'false' }),
    )
    expect(screen.getByTestId('leaderboard-visible-toggle')).toHaveAttribute('aria-pressed', 'false')
  })

  it('reverts the toggle when the PATCH fails', async () => {
    mockPatch.mockImplementationOnce(() => Promise.reject(new Error('boom')))
    render(<PrivacySettings initialVisible={true} />)
    fireEvent.click(screen.getByTestId('leaderboard-visible-toggle'))
    // Optimistic flip then revert back to ON after the failure
    await waitFor(() =>
      expect(screen.getByTestId('leaderboard-visible-toggle')).toHaveAttribute('aria-pressed', 'true'),
    )
  })
})
