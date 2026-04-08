import React from 'react'
import { render } from '@testing-library/react-native'
import { HomeScreen } from './HomeScreen'

// Mock auth store
jest.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({
    user: { name: 'Tester', email: 'test@test.com', avatar: null },
    isAdmin: false,
  }),
}))

// Mock TanStack Query
const queryMocks: Record<string, any> = {
  me: { totalPoints: 1500, streakDays: 5, totalSessions: 42, name: 'Tester' },
  'home-leaderboard': { content: [] },
  'home-my-rank': { rank: 1, totalPoints: 1500 },
  'ranked-status': { livesRemaining: 80, dailyLives: 100, questionsToday: 5 },
}

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(({ queryKey }: any) => ({
    data: queryMocks[queryKey[0]] ?? {},
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }: any) => children,
}))

// Mock API
jest.mock('../../api/client', () => ({
  api: { get: jest.fn().mockResolvedValue({ data: {} }) },
}))

// Mock daily verse
jest.mock('../../data/verses', () => ({
  getDailyVerse: () => ({ text: 'Verse text', ref: 'Psalm 23:1' }),
}))

// Mock components used
jest.mock('../../components/Avatar', () => ({
  Avatar: () => 'Avatar',
}))

jest.mock('../../components/TierBadge', () => ({
  TierBadge: () => 'TierBadge',
}))

describe('HomeScreen', () => {
  test('renders greeting', () => {
    const { getByText } = render(<HomeScreen />)
    // Should contain one of the greetings
    const greeting = ['Chào buổi sáng', 'Chào buổi chiều', 'Chào buổi tối']
    const found = greeting.some((g) => {
      try {
        getByText(new RegExp(g))
        return true
      } catch {
        return false
      }
    })
    expect(found).toBe(true)
  })

  test('renders user name', () => {
    const { getByText } = render(<HomeScreen />)
    expect(getByText(/Tester/)).toBeTruthy()
  })

  test('renders game mode cards', () => {
    const { getByText } = render(<HomeScreen />)
    expect(getByText('Luyện Tập')).toBeTruthy()
    expect(getByText('Thi Đấu Xếp Hạng')).toBeTruthy()
  })

  test('renders daily verse', () => {
    const { getByText } = render(<HomeScreen />)
    expect(getByText(/"Verse text"/)).toBeTruthy()
  })

  test('renders without crash when data is loading', () => {
    const { useQuery } = require('@tanstack/react-query')
    useQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    })

    // Should render without throwing
    const { root } = render(<HomeScreen />)
    expect(root).toBeTruthy()
  })
})
