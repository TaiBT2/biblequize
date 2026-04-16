import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const mockApiGet = vi.fn()
const mockApiPatch = vi.fn()
vi.mock('../../api/client', () => ({
  api: {
    get: (...args: any[]) => mockApiGet(...args),
    patch: (...args: any[]) => mockApiPatch(...args),
  },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

import Cosmetics from '../Cosmetics'

const mockCosmeticsData = {
  activeFrame: 'frame_tier1',
  activeTheme: 'theme_tier1',
  frames: [
    { id: 'frame_tier1', name: 'Môn Sinh', tier: 1, unlocked: true, active: true },
    { id: 'frame_tier2', name: 'Tín Hữu', tier: 2, unlocked: true, active: false },
    { id: 'frame_tier3', name: 'Phó Tế', tier: 3, unlocked: false, active: false },
  ],
  themes: [
    { id: 'theme_tier1', name: 'Classic', tier: 1, unlocked: true, active: true },
    { id: 'theme_tier2', name: 'Ocean', tier: 2, unlocked: false, active: false },
  ],
}

function renderCosmetics() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Cosmetics />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Cosmetics Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Shows loading skeleton initially
  it('shows loading skeleton when data is loading', () => {
    mockApiGet.mockReturnValue(new Promise(() => {})) // never resolves
    renderCosmetics()
    // Should show animated pulse skeleton
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  // 2. Renders page with data-testid
  it('renders page with data-testid="cosmetics-page"', async () => {
    mockApiGet.mockResolvedValue({ data: mockCosmeticsData })
    renderCosmetics()
    expect(await screen.findByTestId('cosmetics-page')).toBeInTheDocument()
  })

  // 3. Renders frames section
  it('renders avatar frames section with items', async () => {
    mockApiGet.mockResolvedValue({ data: mockCosmeticsData })
    renderCosmetics()
    expect(await screen.findByTestId('cosmetics-frames-section')).toBeInTheDocument()
    expect(screen.getByText('Môn Sinh')).toBeInTheDocument()
    expect(screen.getByText('Tín Hữu')).toBeInTheDocument()
    expect(screen.getByText('Phó Tế')).toBeInTheDocument()
  })

  // 4. Renders themes section
  it('renders quiz themes section with items', async () => {
    mockApiGet.mockResolvedValue({ data: mockCosmeticsData })
    renderCosmetics()
    expect(await screen.findByTestId('cosmetics-themes-section')).toBeInTheDocument()
    expect(screen.getByText('Classic')).toBeInTheDocument()
    expect(screen.getByText('Ocean')).toBeInTheDocument()
  })

  // 5. Shows active status for equipped items
  it('shows active status for equipped items', async () => {
    mockApiGet.mockResolvedValue({ data: mockCosmeticsData })
    renderCosmetics()
    await screen.findByTestId('cosmetics-page')
    const activeLabels = screen.getAllByText('✓ Đang dùng')
    expect(activeLabels.length).toBe(2) // one frame + one theme
  })

  // 6. Shows locked status for locked items
  it('shows locked status for locked items', async () => {
    mockApiGet.mockResolvedValue({ data: mockCosmeticsData })
    renderCosmetics()
    await screen.findByTestId('cosmetics-page')
    expect(screen.getByText('Đạt T3 để mở')).toBeInTheDocument()
    expect(screen.getByText('Đạt T2 để mở')).toBeInTheDocument()
  })

  // 7. Clicking unlocked frame calls API to equip
  it('calls mutation when clicking an unlocked frame', async () => {
    mockApiGet.mockResolvedValue({ data: mockCosmeticsData })
    mockApiPatch.mockResolvedValue({ data: {} })
    renderCosmetics()
    await screen.findByTestId('cosmetics-page')
    // Click on "Tín Hữu" which is unlocked but not active
    fireEvent.click(screen.getByText('Tín Hữu').closest('button')!)
    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith('/api/me/cosmetics', { activeFrame: 'frame_tier2' })
    })
  })

  // 8. Locked items are disabled
  it('locked items have disabled buttons', async () => {
    mockApiGet.mockResolvedValue({ data: mockCosmeticsData })
    renderCosmetics()
    await screen.findByTestId('cosmetics-page')
    const lockedBtn = screen.getByText('Phó Tế').closest('button')!
    expect(lockedBtn).toBeDisabled()
  })

  // 9. Shows page header
  it('shows page header with title', async () => {
    mockApiGet.mockResolvedValue({ data: mockCosmeticsData })
    renderCosmetics()
    expect(await screen.findByText('Ngoại hình')).toBeInTheDocument()
  })

  // 10. Back link points to profile
  it('has back link to profile', async () => {
    mockApiGet.mockResolvedValue({ data: mockCosmeticsData })
    renderCosmetics()
    await screen.findByTestId('cosmetics-page')
    const link = screen.getByText('arrow_back').closest('a')!
    expect(link).toHaveAttribute('href', '/profile')
  })
})
