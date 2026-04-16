import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockApiGet = vi.fn()
const mockApiPost = vi.fn()
vi.mock('../../api/client', () => ({
  api: {
    get: (...args: any[]) => mockApiGet(...args),
    post: (...args: any[]) => mockApiPost(...args),
    patch: vi.fn(),
  },
}))

const mockUser = { name: 'Minh', email: 'minh@test.com' }
vi.mock('../../store/authStore', () => ({
  useAuthStore: () => ({ user: mockUser }),
}))

import ComebackModal from '../ComebackModal'

function renderModal() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <ComebackModal />
    </QueryClientProvider>
  )
}

describe('ComebackModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Renders nothing when rewardTier is NONE
  it('renders nothing when rewardTier is NONE', async () => {
    mockApiGet.mockResolvedValue({
      data: { daysSinceLastPlay: 0, rewardTier: 'NONE', claimed: false, reward: null },
    })
    const { container } = renderModal()
    await vi.waitFor(() => expect(mockApiGet).toHaveBeenCalled())
    expect(container.innerHTML).toBe('')
  })

  // 2. Renders nothing when already claimed
  it('renders nothing when reward is already claimed', async () => {
    mockApiGet.mockResolvedValue({
      data: { daysSinceLastPlay: 5, rewardTier: 'SILVER', claimed: true, reward: null },
    })
    const { container } = renderModal()
    await vi.waitFor(() => expect(mockApiGet).toHaveBeenCalled())
    expect(container.innerHTML).toBe('')
  })

  // 3. Renders modal with user name and days
  it('renders welcome back message with user name and days', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        daysSinceLastPlay: 7,
        rewardTier: 'GOLD',
        claimed: false,
        reward: { description: 'Gold reward', xpBonus: 100 },
      },
    })
    renderModal()
    expect(await screen.findByText(/Chào mừng trở lại.*Minh/)).toBeInTheDocument()
    expect(screen.getByText(/vắng 7 ngày/)).toBeInTheDocument()
  })

  // 4. Shows reward details
  it('shows reward description and XP bonus', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        daysSinceLastPlay: 3,
        rewardTier: 'SILVER',
        claimed: false,
        reward: { description: 'Silver pack', xpBonus: 50 },
      },
    })
    renderModal()
    expect(await screen.findByText('Silver pack')).toBeInTheDocument()
    expect(screen.getByText('+50 XP')).toBeInTheDocument()
  })

  // 5. Shows XP multiplier badge
  it('shows XP multiplier when present in reward', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        daysSinceLastPlay: 5,
        rewardTier: 'GOLD',
        claimed: false,
        reward: { description: 'Bonus', xpMultiplier: 2 },
      },
    })
    renderModal()
    expect(await screen.findByText(/x2/)).toBeInTheDocument()
  })

  // 6. Dismiss button hides modal
  it('hides modal when dismiss button is clicked', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        daysSinceLastPlay: 3,
        rewardTier: 'SILVER',
        claimed: false,
        reward: { description: 'Reward' },
      },
    })
    renderModal()
    const dismissBtn = await screen.findByText('Để sau')
    fireEvent.click(dismissBtn)
    expect(screen.queryByTestId('comeback-modal')).not.toBeInTheDocument()
  })

  // 7. Claim button calls API
  it('calls claim API when claim button is clicked', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        daysSinceLastPlay: 3,
        rewardTier: 'SILVER',
        claimed: false,
        reward: { description: 'Reward' },
      },
    })
    mockApiPost.mockResolvedValue({ data: { success: true } })
    renderModal()
    const claimBtn = await screen.findByText('Nhận ngay! 🎁')
    fireEvent.click(claimBtn)
    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/api/me/comeback-claim')
    })
  })

  // 8. Shows freeze token badge when present
  it('shows freeze token badge when present in reward', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        daysSinceLastPlay: 10,
        rewardTier: 'PLATINUM',
        claimed: false,
        reward: { description: 'Plat pack', freezeToken: 3 },
      },
    })
    renderModal()
    expect(await screen.findByText(/3 Freeze/)).toBeInTheDocument()
  })

  // 9. Has data-testid
  it('has data-testid="comeback-modal"', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        daysSinceLastPlay: 3,
        rewardTier: 'SILVER',
        claimed: false,
        reward: { description: 'R' },
      },
    })
    renderModal()
    expect(await screen.findByTestId('comeback-modal')).toBeInTheDocument()
  })
})
