import React from 'react'
import { render } from '@testing-library/react-native'
import { QuizScreen } from './QuizScreen'

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn(), replace: jest.fn() }),
  useRoute: () => ({
    params: { sessionId: 'test-session', mode: 'practice' },
  }),
}))

jest.mock('../../api/client', () => ({
  api: {
    get: jest.fn().mockResolvedValue({
      data: {
        questions: [
          {
            id: 'q1',
            content: 'Who built the ark?',
            bookName: 'Genesis',
            chapter: 6,
            difficulty: 'easy',
            options: ['Moses', 'Noah', 'Abraham', 'David'],
            correctAnswer: [1],
          },
        ],
      },
    }),
    post: jest.fn().mockResolvedValue({ data: { correct: true } }),
  },
}))

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}))

describe('QuizScreen', () => {
  test('shows loading text initially', () => {
    const { getByText } = render(<QuizScreen />)
    expect(getByText('Đang tải câu hỏi...')).toBeTruthy()
  })

  test('renders question after API resolves', async () => {
    const { findByText } = render(<QuizScreen />)
    expect(await findByText('Who built the ark?')).toBeTruthy()
  })

  test('renders answer options', async () => {
    const { findByText } = render(<QuizScreen />)
    expect(await findByText('Noah')).toBeTruthy()
  })

  test('shows question counter', async () => {
    const { findByText } = render(<QuizScreen />)
    expect(await findByText('Câu hỏi 1/1')).toBeTruthy()
  })

  test('shows book reference', async () => {
    const { findByText } = render(<QuizScreen />)
    expect(await findByText(/Genesis/)).toBeTruthy()
  })
})
