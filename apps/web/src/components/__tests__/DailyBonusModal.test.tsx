import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('../../services/soundManager', () => ({
  soundManager: { play: vi.fn() },
}))

const mockApiGet = vi.fn()
vi.mock('../../api/client', () => ({
  api: { get: (...args: any[]) => mockApiGet(...args) },
}))

import DailyBonusModal from '../DailyBonusModal'
import { soundManager } from '../../services/soundManager'

function renderModal() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <DailyBonusModal />
    </QueryClientProvider>
  )
}

describe('DailyBonusModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear the per-day dismissal key so tests don't interfere with each other.
    window.localStorage.removeItem('dailyBonusDismissed')
  })

  // 1. Renders nothing when no bonus
  it('renders nothing when hasBonus is false', async () => {
    mockApiGet.mockResolvedValue({ data: { hasBonus: false } })
    const { container } = renderModal()
    // Wait for query to resolve
    await vi.waitFor(() => {
      expect(mockApiGet).toHaveBeenCalled()
    })
    expect(container.innerHTML).toBe('')
  })

  // 2. Renders modal when bonus is available
  it('renders modal when hasBonus is true', async () => {
    mockApiGet.mockResolvedValue({
      data: { hasBonus: true, bonusType: 'DOUBLE_XP', message: 'Double XP today!' },
    })
    renderModal()
    expect(await screen.findByText('Quà tặng hôm nay!')).toBeInTheDocument()
    expect(screen.getByText('Double XP today!')).toBeInTheDocument()
  })

  // 3. Shows correct icon for DOUBLE_XP
  it('shows star icon for DOUBLE_XP bonus type', async () => {
    mockApiGet.mockResolvedValue({
      data: { hasBonus: true, bonusType: 'DOUBLE_XP', message: 'x2' },
    })
    renderModal()
    expect(await screen.findByText('⭐')).toBeInTheDocument()
  })

  // 4. Shows correct icon for EXTRA_ENERGY
  it('shows lightning icon for EXTRA_ENERGY bonus type', async () => {
    mockApiGet.mockResolvedValue({
      data: { hasBonus: true, bonusType: 'EXTRA_ENERGY', message: '+5 energy' },
    })
    renderModal()
    expect(await screen.findByText('⚡')).toBeInTheDocument()
  })

  // 5. Shows default icon for unknown bonus type
  it('shows gift icon for unknown bonus type', async () => {
    mockApiGet.mockResolvedValue({
      data: { hasBonus: true, bonusType: 'UNKNOWN', message: 'Surprise!' },
    })
    renderModal()
    expect(await screen.findByText('🎁')).toBeInTheDocument()
  })

  // 6. Dismiss button hides modal
  it('hides modal after clicking dismiss button', async () => {
    mockApiGet.mockResolvedValue({
      data: { hasBonus: true, bonusType: 'DOUBLE_XP', message: 'x2 XP' },
    })
    renderModal()
    const btn = await screen.findByText('Tuyệt vời!')
    fireEvent.click(btn)
    expect(screen.queryByText('Quà tặng hôm nay!')).not.toBeInTheDocument()
  })

  // 7. Plays sound on dismiss
  it('plays badgeUnlock sound on dismiss', async () => {
    mockApiGet.mockResolvedValue({
      data: { hasBonus: true, bonusType: 'DOUBLE_XP', message: 'x2' },
    })
    renderModal()
    const btn = await screen.findByText('Tuyệt vời!')
    fireEvent.click(btn)
    expect(soundManager.play).toHaveBeenCalledWith('badgeUnlock')
  })

  // 8. Calls API with correct URL
  it('calls /api/quiz/daily-bonus endpoint', async () => {
    mockApiGet.mockResolvedValue({ data: { hasBonus: false } })
    renderModal()
    await vi.waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith('/api/quiz/daily-bonus')
    })
  })

  // 9. Dismiss persists across remounts (same day)
  it('stays hidden after remount on the same day once dismissed', async () => {
    mockApiGet.mockResolvedValue({
      data: { hasBonus: true, bonusType: 'FREE_FREEZE', message: 'Freeze!' },
    })

    const { unmount } = renderModal()
    const btn = await screen.findByText('Tuyệt vời!')
    fireEvent.click(btn)
    unmount()

    // Remount (simulates Home → Profile → Home nav, or browser tab switch
    // that triggers React Query focus refetch + component re-render).
    renderModal()
    // Give the query a tick to resolve; title must NOT reappear.
    await vi.waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledTimes(2)
    })
    expect(screen.queryByText('Quà tặng hôm nay!')).not.toBeInTheDocument()
  })

  // 10. Yesterday's dismiss doesn't suppress today's modal
  it('shows modal if the stored dismissal is from a previous day', async () => {
    // Seed an old date key — must not suppress today's bonus.
    window.localStorage.setItem('dailyBonusDismissed', '2000-01-01')
    mockApiGet.mockResolvedValue({
      data: { hasBonus: true, bonusType: 'DOUBLE_XP', message: '2x XP' },
    })
    renderModal()
    expect(await screen.findByText('Quà tặng hôm nay!')).toBeInTheDocument()
  })
})
