import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

/**
 * Tests for GameModeGrid — 6 game mode cards on the Home page (Stitch design).
 * Covers: rendering, API status fetching, energy display, countdown,
 * disabled states, room count, navigation.
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
    mockApiGet.mockRejectedValue(new Error('Not mocked'))
  })

  describe('Rendering', () => {
    it('renders all 6 game mode cards', () => {
      renderGrid()
      expect(screen.getByText('Luyện Tập')).toBeInTheDocument()
      expect(screen.getByText('Thi Đấu Xếp Hạng')).toBeInTheDocument()
      expect(screen.getByText('Thử Thách Ngày')).toBeInTheDocument()
      expect(screen.getByText('Nhóm Giáo Xứ')).toBeInTheDocument()
      expect(screen.getByText('Phòng Chơi')).toBeInTheDocument()
      expect(screen.getByText('Giải Đấu')).toBeInTheDocument()
    })

    it('renders CTA buttons for all cards', () => {
      renderGrid()
      expect(screen.getByText('Bắt Đầu')).toBeInTheDocument()
      expect(screen.getByText('Vào Thi Đấu')).toBeInTheDocument()
      expect(screen.getByText('Thử Thách Ngay')).toBeInTheDocument()
      expect(screen.getByText('Vào Nhóm')).toBeInTheDocument()
      expect(screen.getByText('Tạo Phòng')).toBeInTheDocument()
      expect(screen.getByText('Vào Giải Đấu')).toBeInTheDocument()
    })

    it('renders Practice card status tag', () => {
      renderGrid()
      expect(screen.getAllByText(/không giới hạn/i).length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Energy display (Ranked card)', () => {
    it('shows energy from API with correct field names (livesRemaining/dailyLives)', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url.includes('ranked-status'))
          return Promise.resolve({ data: { livesRemaining: 75, dailyLives: 100 } })
        return Promise.reject(new Error('Not found'))
      })

      renderGrid()

      await waitFor(() => {
        expect(screen.getByText(/75\/100/i)).toBeInTheDocument()
      })
    })

    it('shows 0/100 when energy is zero', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url.includes('ranked-status'))
          return Promise.resolve({ data: { livesRemaining: 0, dailyLives: 100 } })
        return Promise.reject(new Error('Not found'))
      })

      renderGrid()

      await waitFor(() => {
        expect(screen.getByText(/0\/100/i)).toBeInTheDocument()
      })
    })

    it('shows fallback energy when API errors', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'))

      renderGrid()

      await waitFor(() => {
        // Falls back to default 0/100 since rankedStatus defaults aren't changed on error
        expect(screen.getByText(/0\/100/i)).toBeInTheDocument()
      })
    })

    it('shows no-energy CTA when energy is 0', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url.includes('ranked-status'))
          return Promise.resolve({ data: { livesRemaining: 0, dailyLives: 100 } })
        return Promise.reject(new Error('Not found'))
      })

      renderGrid()

      await waitFor(() => {
        expect(screen.getByText(/Hết Năng Lượng/i)).toBeInTheDocument()
      })
    })

    it('does NOT show UNDEFINED in energy display', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url.includes('ranked-status'))
          return Promise.resolve({ data: {} }) // missing fields
        return Promise.reject(new Error('Not found'))
      })

      renderGrid()

      await waitFor(() => {
        // Should fallback to 0/100, never show undefined
        expect(screen.getByText(/0\/100/i)).toBeInTheDocument()
        expect(screen.queryByText(/undefined/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Daily Challenge card', () => {
    it('shows completed status when daily is completed', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url.includes('daily-challenge'))
          return Promise.resolve({ data: { alreadyCompleted: true } })
        return Promise.reject(new Error('Not found'))
      })

      renderGrid()

      await waitFor(() => {
        expect(screen.getByText(/Đã hoàn thành/i)).toBeInTheDocument()
      })
    })

    it('shows countdown when daily is not completed', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url.includes('daily-challenge'))
          return Promise.resolve({ data: { alreadyCompleted: false } })
        return Promise.reject(new Error('Not found'))
      })

      renderGrid()

      await waitFor(() => {
        expect(screen.getByText(/kết thúc sau/i)).toBeInTheDocument()
      })
    })
  })

  describe('Multiplayer card (room count)', () => {
    it('shows room count from API (rooms array)', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url.includes('rooms/public'))
          return Promise.resolve({ data: { success: true, rooms: [{}, {}, {}] } })
        return Promise.reject(new Error('Not found'))
      })

      renderGrid()

      await waitFor(() => {
        expect(screen.getByText(/3 phòng đang mở/i)).toBeInTheDocument()
      })
    })

    it('shows 0 rooms when API returns empty rooms', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url.includes('rooms/public'))
          return Promise.resolve({ data: { success: true, rooms: [] } })
        return Promise.reject(new Error('Not found'))
      })

      renderGrid()

      await waitFor(() => {
        expect(screen.getByText(/0 phòng đang mở/i)).toBeInTheDocument()
      })
    })

    it('shows 0 rooms when API errors', async () => {
      mockApiGet.mockRejectedValue(new Error('Network error'))

      renderGrid()

      await waitFor(() => {
        expect(screen.getByText(/0 phòng đang mở/i)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('navigates to /practice when Practice CTA clicked', async () => {
      renderGrid()
      const user = userEvent.setup()
      await user.click(screen.getByText('Bắt Đầu'))
      expect(mockNavigate).toHaveBeenCalledWith('/practice')
    })

    it('navigates to /daily when Daily CTA clicked', async () => {
      renderGrid()
      const user = userEvent.setup()
      await user.click(screen.getByText('Thử Thách Ngay'))
      expect(mockNavigate).toHaveBeenCalledWith('/daily')
    })

    it('navigates to /multiplayer when Multiplayer CTA clicked', async () => {
      renderGrid()
      const user = userEvent.setup()
      await user.click(screen.getByText('Tạo Phòng'))
      expect(mockNavigate).toHaveBeenCalledWith('/multiplayer')
    })

    it('navigates to /groups when Church Group CTA clicked', async () => {
      renderGrid()
      const user = userEvent.setup()
      await user.click(screen.getByText('Vào Nhóm'))
      expect(mockNavigate).toHaveBeenCalledWith('/groups')
    })

    it('navigates to /tournaments when Tournament CTA clicked', async () => {
      renderGrid()
      const user = userEvent.setup()
      await user.click(screen.getByText('Vào Giải Đấu'))
      expect(mockNavigate).toHaveBeenCalledWith('/tournaments')
    })

    it('does NOT navigate when Ranked card clicked with 0 energy', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url.includes('ranked-status'))
          return Promise.resolve({ data: { livesRemaining: 0, dailyLives: 100 } })
        return Promise.reject(new Error('Not found'))
      })

      renderGrid()

      await waitFor(() => {
        expect(screen.getByText(/Hết Năng Lượng/i)).toBeInTheDocument()
      })

      const user = userEvent.setup()
      await user.click(screen.getByText(/Hết Năng Lượng/i))
      expect(mockNavigate).not.toHaveBeenCalledWith('/ranked')
    })
  })

  describe('Error handling', () => {
    it('handles all API errors gracefully without crashing', () => {
      mockApiGet.mockRejectedValue(new Error('Network error'))
      expect(() => renderGrid()).not.toThrow()
    })
  })
})
