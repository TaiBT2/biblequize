import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      if (params) return `${key}|name=${params.name}|time=${params.time}`
      return key
    },
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
}))

import LiveFeed from '../LiveFeed'

describe('LiveFeed', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders nothing when incoming is null', () => {
    const { container } = render(<LiveFeed incoming={null} myId="me" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when there are no events (empty state)', () => {
    const { container } = render(<LiveFeed incoming={null} myId="me" />)
    expect(container.querySelector('.absolute')).toBeNull()
  })

  it('renders a feed event when incoming data arrives from another player', () => {
    const incoming = { playerId: 'other', username: 'Alice', isCorrect: true, reactionTimeMs: 2500 }
    const { container } = render(<LiveFeed incoming={incoming} myId="me" />)
    // Should render the container div and one event
    const wrapper = container.querySelector('.absolute.top-20')
    expect(wrapper).toBeTruthy()
    expect(wrapper!.children.length).toBe(1)
  })

  it('ignores incoming events from the current player (myId)', () => {
    const incoming = { playerId: 'me', username: 'Me', isCorrect: true, reactionTimeMs: 1000 }
    const { container } = render(<LiveFeed incoming={incoming} myId="me" />)
    expect(container.innerHTML).toBe('')
  })

  it('displays correct answer with green styling', () => {
    const incoming = { playerId: 'other', username: 'Alice', isCorrect: true, reactionTimeMs: 2500 }
    const { container } = render(<LiveFeed incoming={incoming} myId="me" />)
    const event = container.querySelector('.bg-green-500\\/20')
    expect(event).toBeTruthy()
    expect(event!.className).toContain('text-green-400')
  })

  it('displays wrong answer with red styling', () => {
    const incoming = { playerId: 'other', username: 'Bob', isCorrect: false, reactionTimeMs: 3000 }
    const { container } = render(<LiveFeed incoming={incoming} myId="me" />)
    const event = container.querySelector('.bg-red-500\\/20')
    expect(event).toBeTruthy()
    expect(event!.className).toContain('text-red-400')
  })

  it('uses correct translation key for correct answers', () => {
    // Math.random mocked to 0.5 => index = floor(0.5*4) = 2 => CORRECT_KEYS[2]
    const incoming = { playerId: 'other', username: 'Alice', isCorrect: true, reactionTimeMs: 2500 }
    const { container } = render(<LiveFeed incoming={incoming} myId="me" />)
    const event = container.querySelector('.bg-green-500\\/20')
    expect(event!.textContent).toContain('liveFeed.correct3')
    expect(event!.textContent).toContain('name=Alice')
    expect(event!.textContent).toContain('time=2.5')
  })

  it('uses wrong translation key for wrong answers', () => {
    // Math.random mocked to 0.5 => index = floor(0.5*3) = 1 => WRONG_KEYS[1]
    const incoming = { playerId: 'other', username: 'Bob', isCorrect: false, reactionTimeMs: 3000 }
    const { container } = render(<LiveFeed incoming={incoming} myId="me" />)
    const event = container.querySelector('.bg-red-500\\/20')
    expect(event!.textContent).toContain('liveFeed.wrong2')
    expect(event!.textContent).toContain('name=Bob')
  })

  it('auto-removes event after 3000ms timeout', () => {
    const incoming = { playerId: 'other', username: 'Alice', isCorrect: true, reactionTimeMs: 1000 }
    const { container } = render(<LiveFeed incoming={incoming} myId="me" />)
    expect(container.querySelector('.absolute.top-20')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    // After timeout, events are removed and component returns null
    expect(container.innerHTML).toBe('')
  })

  it('keeps max 3 events visible (slices to last 3)', () => {
    const { rerender, container } = render(
      <LiveFeed incoming={{ playerId: 'a', username: 'A', isCorrect: true, reactionTimeMs: 100 }} myId="me" />
    )
    rerender(
      <LiveFeed incoming={{ playerId: 'b', username: 'B', isCorrect: false, reactionTimeMs: 200 }} myId="me" />
    )
    rerender(
      <LiveFeed incoming={{ playerId: 'c', username: 'C', isCorrect: true, reactionTimeMs: 300 }} myId="me" />
    )
    rerender(
      <LiveFeed incoming={{ playerId: 'd', username: 'D', isCorrect: false, reactionTimeMs: 400 }} myId="me" />
    )

    const wrapper = container.querySelector('.absolute.top-20')
    // slice(-2) keeps last 2, then adds new one = max 3
    expect(wrapper!.children.length).toBeLessThanOrEqual(3)
  })

  it('has animate-slideInRight class for animation', () => {
    const incoming = { playerId: 'other', username: 'Alice', isCorrect: true, reactionTimeMs: 1000 }
    const { container } = render(<LiveFeed incoming={incoming} myId="me" />)
    const event = container.querySelector('.animate-slideInRight')
    expect(event).toBeTruthy()
  })

  it('has pointer-events-none on the container', () => {
    const incoming = { playerId: 'other', username: 'Alice', isCorrect: true, reactionTimeMs: 1000 }
    const { container } = render(<LiveFeed incoming={incoming} myId="me" />)
    const wrapper = container.querySelector('.pointer-events-none')
    expect(wrapper).toBeTruthy()
  })
})
