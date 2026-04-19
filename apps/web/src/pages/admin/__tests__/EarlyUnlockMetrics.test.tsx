import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithI18n } from '../../../test/i18n-test-utils'

const mockApiGet = vi.fn()
vi.mock('../../../api/client', () => ({
  api: { get: (...args: any[]) => mockApiGet(...args) },
}))

import EarlyUnlockMetrics from '../EarlyUnlockMetrics'

function makeTimeline(counts: number[]): Array<{ date: string; count: number }> {
  const today = new Date()
  return counts.map((count, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (counts.length - 1 - i))
    return { date: d.toISOString().slice(0, 10), count }
  })
}

function emptyTimeline() {
  return makeTimeline(new Array(30).fill(0))
}

describe('EarlyUnlockMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows skeleton while loading', () => {
    // Never-resolving promise → stay in loading state
    mockApiGet.mockImplementation(() => new Promise(() => {}))
    renderWithI18n(<EarlyUnlockMetrics />)
    expect(screen.getByTestId('early-unlock-metrics-loading')).toBeInTheDocument()
  })

  it('renders empty state when totalUnlockers = 0', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        totalUnlockers: 0,
        unlocksLast7Days: 0,
        unlocksLast30Days: 0,
        avgAccuracyPctAtUnlock: null,
        timeline: emptyTimeline(),
      },
    })
    renderWithI18n(<EarlyUnlockMetrics />)
    await waitFor(() => {
      expect(screen.getByTestId('early-unlock-metrics-page')).toBeInTheDocument()
    })
    expect(screen.getByTestId('early-unlock-empty')).toBeInTheDocument()
    expect(screen.queryByTestId('timeline-chart')).not.toBeInTheDocument()
  })

  it('renders all four KPI cards with formatted values', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        totalUnlockers: 1234,
        unlocksLast7Days: 12,
        unlocksLast30Days: 87,
        avgAccuracyPctAtUnlock: 87.5,
        timeline: makeTimeline([0, 0, 1, 2, 0, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
      },
    })
    renderWithI18n(<EarlyUnlockMetrics />)
    await waitFor(() => expect(screen.getByTestId('kpi-total-unlockers')).toBeInTheDocument())

    expect(screen.getByTestId('kpi-total-unlockers')).toHaveTextContent('1,234')
    expect(screen.getByTestId('kpi-unlocks-7d')).toHaveTextContent('12')
    expect(screen.getByTestId('kpi-unlocks-30d')).toHaveTextContent('87')
    expect(screen.getByTestId('kpi-avg-accuracy')).toHaveTextContent('87.5%')
  })

  it('renders em-dash when avgAccuracy is null but unlockers exist (defensive)', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        totalUnlockers: 5,
        unlocksLast7Days: 5,
        unlocksLast30Days: 5,
        avgAccuracyPctAtUnlock: null,
        timeline: makeTimeline([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0]),
      },
    })
    renderWithI18n(<EarlyUnlockMetrics />)
    await waitFor(() => expect(screen.getByTestId('kpi-avg-accuracy')).toBeInTheDocument())
    expect(screen.getByTestId('kpi-avg-accuracy')).toHaveTextContent('—')
  })

  it('renders the timeline chart with 30 bars when data is present', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        totalUnlockers: 3,
        unlocksLast7Days: 3,
        unlocksLast30Days: 3,
        avgAccuracyPctAtUnlock: 85,
        timeline: makeTimeline([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1]),
      },
    })
    renderWithI18n(<EarlyUnlockMetrics />)
    await waitFor(() => expect(screen.getByTestId('timeline-chart')).toBeInTheDocument())
    // 30 bar slots
    for (let i = 0; i < 30; i++) {
      expect(screen.getByTestId(`timeline-bar-${i}`)).toBeInTheDocument()
    }
  })

  it('renders error state when the query fails', async () => {
    mockApiGet.mockRejectedValue(new Error('500'))
    renderWithI18n(<EarlyUnlockMetrics />)
    await waitFor(() => {
      expect(screen.getByTestId('early-unlock-metrics-error')).toBeInTheDocument()
    })
  })

  it('calls the correct admin endpoint', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        totalUnlockers: 0,
        unlocksLast7Days: 0,
        unlocksLast30Days: 0,
        avgAccuracyPctAtUnlock: null,
        timeline: emptyTimeline(),
      },
    })
    renderWithI18n(<EarlyUnlockMetrics />)
    await waitFor(() => expect(mockApiGet).toHaveBeenCalled())
    expect(mockApiGet).toHaveBeenCalledWith('/api/admin/metrics/early-unlock')
  })
})
