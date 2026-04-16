import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock dependencies
vi.mock('../../api/config', () => ({
  resolveWsUrl: (url: string) => `ws://localhost:8080${url}`,
}))

vi.mock('../../api/tokenStore', () => ({
  getAccessToken: vi.fn(() => 'test-token'),
}))

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1
  static CLOSED = 3
  url: string
  readyState = MockWebSocket.OPEN
  onopen: ((ev: any) => void) | null = null
  onclose: ((ev: any) => void) | null = null
  onerror: ((ev: any) => void) | null = null
  onmessage: ((ev: any) => void) | null = null
  send = vi.fn()
  close = vi.fn()

  constructor(url: string) {
    this.url = url
    // Simulate async connection
    setTimeout(() => this.onopen?.({ type: 'open' }), 0)
  }
}

// Store reference for triggering events in tests
let lastCreatedSocket: MockWebSocket

const OriginalWebSocket = globalThis.WebSocket

beforeEach(() => {
  vi.useFakeTimers()
  globalThis.WebSocket = class extends MockWebSocket {
    constructor(url: string) {
      super(url)
      lastCreatedSocket = this
    }
  } as any
  // Also set OPEN/CLOSED on the class
  ;(globalThis.WebSocket as any).OPEN = MockWebSocket.OPEN
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  globalThis.WebSocket = OriginalWebSocket
})

// Import after mocks
import { useWebSocket, MESSAGE_TYPES } from '../useWebSocket'

describe('useWebSocket', () => {
  const defaultProps = { url: '/ws/room/123' }

  it('connects to WebSocket with JWT token on mount', () => {
    renderHook(() => useWebSocket(defaultProps))
    expect(lastCreatedSocket.url).toContain('ws://localhost:8080/ws/room/123')
    expect(lastCreatedSocket.url).toContain('token=test-token')
  })

  it('sets isConnected=true after open', async () => {
    const { result } = renderHook(() => useWebSocket(defaultProps))
    expect(result.current.isConnected).toBe(false)

    await act(async () => { vi.advanceTimersByTime(10) })
    expect(result.current.isConnected).toBe(true)
  })

  it('dispatches PLAYER_JOINED to onPlayerJoined callback', async () => {
    const onPlayerJoined = vi.fn()
    renderHook(() => useWebSocket({ ...defaultProps, onPlayerJoined }))
    await act(async () => { vi.advanceTimersByTime(10) })

    const data = { playerId: 'p1', username: 'Alice' }
    act(() => {
      lastCreatedSocket.onmessage?.({
        data: JSON.stringify({ type: MESSAGE_TYPES.PLAYER_JOINED, data, timestamp: '123' }),
      })
    })

    expect(onPlayerJoined).toHaveBeenCalledWith(data)
  })

  it('dispatches PLAYER_LEFT to onPlayerLeft callback', async () => {
    const onPlayerLeft = vi.fn()
    renderHook(() => useWebSocket({ ...defaultProps, onPlayerLeft }))
    await act(async () => { vi.advanceTimersByTime(10) })

    act(() => {
      lastCreatedSocket.onmessage?.({
        data: JSON.stringify({ type: MESSAGE_TYPES.PLAYER_LEFT, data: { playerId: 'p1' }, timestamp: '1' }),
      })
    })

    expect(onPlayerLeft).toHaveBeenCalledWith({ playerId: 'p1' })
  })

  it('dispatches PLAYER_UNREADY to onPlayerUnready (not onPlayerReady)', async () => {
    const onPlayerReady = vi.fn()
    const onPlayerUnready = vi.fn()
    renderHook(() => useWebSocket({ ...defaultProps, onPlayerReady, onPlayerUnready }))
    await act(async () => { vi.advanceTimersByTime(10) })

    act(() => {
      lastCreatedSocket.onmessage?.({
        data: JSON.stringify({ type: MESSAGE_TYPES.PLAYER_UNREADY, data: { playerId: 'p1', isReady: false }, timestamp: '1' }),
      })
    })

    expect(onPlayerUnready).toHaveBeenCalled()
    expect(onPlayerReady).not.toHaveBeenCalled()
  })

  it('dispatches QUESTION_START to onQuestionStart callback', async () => {
    const onQuestionStart = vi.fn()
    renderHook(() => useWebSocket({ ...defaultProps, onQuestionStart }))
    await act(async () => { vi.advanceTimersByTime(10) })

    const data = { questionIndex: 0, totalQuestions: 10, question: {}, timeLimit: 30 }
    act(() => {
      lastCreatedSocket.onmessage?.({
        data: JSON.stringify({ type: MESSAGE_TYPES.QUESTION_START, data, timestamp: '1' }),
      })
    })

    expect(onQuestionStart).toHaveBeenCalledWith(data)
  })

  it('dispatches SCORE_UPDATE to onScoreUpdate callback', async () => {
    const onScoreUpdate = vi.fn()
    renderHook(() => useWebSocket({ ...defaultProps, onScoreUpdate }))
    await act(async () => { vi.advanceTimersByTime(10) })

    const data = { playerId: 'p1', username: 'A', newScore: 100, correctAnswers: 5, totalAnswered: 7 }
    act(() => {
      lastCreatedSocket.onmessage?.({
        data: JSON.stringify({ type: MESSAGE_TYPES.SCORE_UPDATE, data, timestamp: '1' }),
      })
    })

    expect(onScoreUpdate).toHaveBeenCalledWith(data)
  })

  it('dispatches ERROR to onError callback', async () => {
    const onError = vi.fn()
    renderHook(() => useWebSocket({ ...defaultProps, onError }))
    await act(async () => { vi.advanceTimersByTime(10) })

    const data = { error: 'ROOM_FULL', message: 'Room is full' }
    act(() => {
      lastCreatedSocket.onmessage?.({
        data: JSON.stringify({ type: MESSAGE_TYPES.ERROR, data, timestamp: '1' }),
      })
    })

    expect(onError).toHaveBeenCalledWith(data)
  })

  it('calls onMessage for every message type', async () => {
    const onMessage = vi.fn()
    renderHook(() => useWebSocket({ ...defaultProps, onMessage }))
    await act(async () => { vi.advanceTimersByTime(10) })

    const msg = { type: 'CUSTOM', data: {}, timestamp: '1' }
    act(() => {
      lastCreatedSocket.onmessage?.({ data: JSON.stringify(msg) })
    })

    expect(onMessage).toHaveBeenCalledWith(msg)
  })

  it('handles malformed JSON without crashing', async () => {
    const onMessage = vi.fn()
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderHook(() => useWebSocket({ ...defaultProps, onMessage }))
    await act(async () => { vi.advanceTimersByTime(10) })

    act(() => {
      lastCreatedSocket.onmessage?.({ data: 'not valid json{{{' })
    })

    expect(onMessage).not.toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('sendMessage sends JSON when connected', async () => {
    const { result } = renderHook(() => useWebSocket(defaultProps))
    await act(async () => { vi.advanceTimersByTime(10) })

    act(() => { result.current.sendMessage('READY', { ready: true }) })

    expect(lastCreatedSocket.send).toHaveBeenCalledWith(
      expect.stringContaining('"type":"READY"')
    )
  })

  it('sendMessage warns when socket is closed', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { result } = renderHook(() => useWebSocket(defaultProps))
    await act(async () => { vi.advanceTimersByTime(10) })

    // Simulate socket closing
    lastCreatedSocket.readyState = MockWebSocket.CLOSED

    act(() => { result.current.sendMessage('READY', {}) })

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not connected'))
    warnSpy.mockRestore()
  })

  it('sets error state on WebSocket error event', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { result } = renderHook(() => useWebSocket(defaultProps))
    await act(async () => { vi.advanceTimersByTime(10) })

    act(() => { lastCreatedSocket.onerror?.({ type: 'error' }) })

    expect(result.current.error).toBe('WebSocket connection error')
  })

  it('attempts reconnect on abnormal close (code !== 1000)', async () => {
    renderHook(() => useWebSocket(defaultProps))
    await act(async () => { vi.advanceTimersByTime(10) })
    const firstSocket = lastCreatedSocket

    // Simulate abnormal close
    act(() => { firstSocket.onclose?.({ code: 1006, reason: '' }) })

    // Advance past reconnect delay (2000ms for attempt 1)
    await act(async () => { vi.advanceTimersByTime(3000) })

    // A new socket should have been created
    expect(lastCreatedSocket).not.toBe(firstSocket)
  })

  it('does not reconnect on normal close (code 1000)', async () => {
    renderHook(() => useWebSocket(defaultProps))
    await act(async () => { vi.advanceTimersByTime(10) })
    const firstSocket = lastCreatedSocket

    act(() => { firstSocket.onclose?.({ code: 1000, reason: 'Manual disconnect' }) })

    await act(async () => { vi.advanceTimersByTime(10000) })

    // No new socket created
    expect(lastCreatedSocket).toBe(firstSocket)
  })
})
