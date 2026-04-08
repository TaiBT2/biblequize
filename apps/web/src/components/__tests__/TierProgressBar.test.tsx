import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockApiGet = vi.fn()
vi.mock('../../api/client', () => ({
  api: { get: (...args: any[]) => mockApiGet(...args) },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
}))

import TierProgressBar from '../TierProgressBar'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
)

describe('TierProgressBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders stars for tier 1', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        tierLevel: 1, tierName: 'Tân Tín Hữu', totalPoints: 450,
        nextTierPoints: 1000, tierProgressPercent: 45.0,
        starIndex: 2, starXp: 400, nextStarXp: 600,
        starProgressPercent: 50.0, milestone: null,
      },
    })
    render(<TierProgressBar />, { wrapper })
    // Wait for query to resolve
    await vi.waitFor(() => {
      expect(screen.getByText('3/5')).toBeInTheDocument()
    })
  })

  it('renders nothing for tier 6', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        tierLevel: 6, tierName: 'Sứ Đồ', totalPoints: 120000,
        nextTierPoints: 100000, tierProgressPercent: 100.0,
        starIndex: 0, starXp: 100000, nextStarXp: 100000,
        starProgressPercent: 100.0, milestone: null,
      },
    })
    const { container } = render(<TierProgressBar />, { wrapper })
    await vi.waitFor(() => {
      expect(mockApiGet).toHaveBeenCalled()
    })
    // Tier 6 should render nothing
    await new Promise(r => setTimeout(r, 100))
    expect(container.querySelector('.flex.items-center.gap-2')).toBeNull()
  })

  it('renders nothing when data not loaded yet', () => {
    mockApiGet.mockReturnValue(new Promise(() => {})) // never resolves
    const { container } = render(<TierProgressBar />, { wrapper })
    expect(container.innerHTML).toBe('')
  })

  it('does not crash on API error', async () => {
    mockApiGet.mockRejectedValue(new Error('Network'))
    const { container } = render(<TierProgressBar />, { wrapper })
    await new Promise(r => setTimeout(r, 100))
    expect(container.innerHTML).toBe('')
  })
})
