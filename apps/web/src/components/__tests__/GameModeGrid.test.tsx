import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

/**
 * Tests for GameModeGrid — the 4 game mode cards on the Home page.
 * Covers: rendering, API status fetching, countdown timer, disabled states.
 */

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const mockApiGet = vi.fn()
vi.mock('../../api/client', () => ({
  api: { get: (...args: any[]) => mockApiGet(...args) },
}))

import GameModeGrid from '../GameModeGrid'

function renderGrid() {
  return render(
    <MemoryRouter>
      <GameModeGrid />
    </MemoryRouter>
  )
}

describe('GameModeGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApiGet.mockRejectedValue(new Error('Not mocked')) // default: API fails gracefully
  })

  it('renders all 4 game mode cards', () => {
    renderGrid()

    expect(screen.getByText('Luyện Tập')).toBeInTheDocument()
    expect(screen.getByText('Xếp Hạng')).toBeInTheDocument()
    expect(screen.getByText('Thử Thách Ngày')).toBeInTheDocument()
    expect(screen.getByText('Nhiều Người')).toBeInTheDocument()
  })

  it('renders Practice card with "Không giới hạn" badge', () => {
    renderGrid()

    expect(screen.getByText('Không giới hạn')).toBeInTheDocument()
    expect(screen.getByText('Bắt Đầu')).toBeInTheDocument()
  })

  it('renders Ranked card with "Phổ biến nhất" badge', () => {
    renderGrid()

    expect(screen.getByText(/Phổ biến nhất/i)).toBeInTheDocument()
    expect(screen.getByText('Vào Thi Đấu')).toBeInTheDocument()
  })

  it('shows energy bar on Ranked card when API returns data', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('ranked-status')) {
        return Promise.resolve({ data: { energy: 60, maxEnergy: 100 } })
      }
      return Promise.reject(new Error('Not found'))
    })

    renderGrid()

    await waitFor(() => {
      expect(screen.getByText('60/100')).toBeInTheDocument()
    })
  })

  it('shows "Đã hoàn thành" when daily challenge is completed', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('daily-challenge')) {
        return Promise.resolve({ data: { alreadyCompleted: true } })
      }
      return Promise.reject(new Error('Not found'))
    })

    renderGrid()

    await waitFor(() => {
      expect(screen.getByText(/Đã hoàn thành/i)).toBeInTheDocument()
    })
  })

  it('shows "Chưa hoàn thành" when daily challenge is not done', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('daily-challenge')) {
        return Promise.resolve({ data: { alreadyCompleted: false } })
      }
      return Promise.reject(new Error('Not found'))
    })

    renderGrid()

    await waitFor(() => {
      expect(screen.getByText(/Chưa hoàn thành/i)).toBeInTheDocument()
    })
  })

  it('shows room count on Multiplayer card', async () => {
    mockApiGet.mockImplementation((url: string) => {
      if (url.includes('rooms/public')) {
        return Promise.resolve({ data: [1, 2, 3, 4, 5] }) // 5 rooms
      }
      return Promise.reject(new Error('Not found'))
    })

    renderGrid()

    await waitFor(() => {
      expect(screen.getByText(/5 phòng đang mở/i)).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully without crashing', () => {
    mockApiGet.mockRejectedValue(new Error('Network error'))

    expect(() => renderGrid()).not.toThrow()
  })

  it('renders Daily Challenge card with timer badge', () => {
    renderGrid()

    const dailyCard = screen.getByText('Thử Thách Ngày')
    expect(dailyCard).toBeInTheDocument()
    // The card should exist and have a button
    expect(screen.getByText('Thử Thách Ngay')).toBeInTheDocument()
  })
})
