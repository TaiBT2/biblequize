import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../api/config', () => ({
  getApiBaseUrl: vi.fn(() => 'http://localhost:8080'),
}))

vi.mock('../../api/tokenStore', () => ({
  getAccessToken: vi.fn(() => 'test-jwt-token'),
}))

// Track the latest client/config created by the mock Client constructor
const _clients: {
  config: any
  instance: any
} [] = []

function lastCreated() {
  return _clients[_clients.length - 1]
}

vi.mock('@stomp/stompjs', () => {
  class MockClient {
    config: any
    activate = vi.fn()
    deactivate = vi.fn()
    subscribe = vi.fn(() => ({ unsubscribe: vi.fn() }))
    publish = vi.fn()

    constructor(config: any) {
      this.config = config
      _clients.push({ config, instance: this })
    }
  }
  return { Client: MockClient }
})

// Import AFTER mocks
import { useStomp, StompOptions } from '../useStomp'
import { getAccessToken } from '../../api/tokenStore'

// ── Helpers ──────────────────────────────────────────────────────────────────

function renderStomp(opts: Partial<StompOptions> = {}) {
  return renderHook(
    (props: StompOptions) => useStomp(props),
    { initialProps: { roomId: 'room-42', ...opts } as StompOptions },
  )
}

function client() { return lastCreated().instance }
function config() { return lastCreated().config }

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useStomp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    _clients.length = 0
  })

  // 1. Activate STOMP client on mount
  it('activates the STOMP client on mount', () => {
    renderStomp()
    expect(client().activate).toHaveBeenCalledTimes(1)
  })

  // 2. Subscribe to /topic/room/{roomId} when connected
  it('subscribes to /topic/room/{roomId} when onConnect fires', () => {
    renderStomp({ roomId: 'abc-123' })

    act(() => { config().onConnect() })

    expect(client().subscribe).toHaveBeenCalledWith(
      '/topic/room/abc-123',
      expect.any(Function),
    )
  })

  // 3. Call onConnect callback on first connect
  it('calls onConnect callback on the first successful connect', () => {
    const onConnect = vi.fn()
    renderStomp({ onConnect })

    act(() => { config().onConnect() })

    expect(onConnect).toHaveBeenCalledTimes(1)
  })

  // 4. Call onReconnect callback on 2nd+ connect
  it('calls onReconnect (not onConnect) on subsequent connects', () => {
    const onConnect = vi.fn()
    const onReconnect = vi.fn()
    renderStomp({ onConnect, onReconnect })

    // First connect
    act(() => { config().onConnect() })
    expect(onConnect).toHaveBeenCalledTimes(1)
    expect(onReconnect).not.toHaveBeenCalled()

    // Second connect (reconnect)
    act(() => { config().onConnect() })
    expect(onConnect).toHaveBeenCalledTimes(1) // still 1
    expect(onReconnect).toHaveBeenCalledTimes(1)
  })

  // 5. Call onDisconnect when WebSocket closes
  it('calls onDisconnect when WebSocket closes', () => {
    const onDisconnect = vi.fn()
    renderStomp({ onDisconnect })

    act(() => { config().onWebSocketClose() })

    expect(onDisconnect).toHaveBeenCalledTimes(1)
  })

  // 6. Parse message body JSON and call onMessage
  it('parses JSON message body and invokes onMessage', () => {
    const onMessage = vi.fn()
    renderStomp({ onMessage })

    // Capture the subscribe callback
    let msgCb: (frame: any) => void = () => {}
    client().subscribe.mockImplementation((_dest: string, cb: (frame: any) => void) => {
      msgCb = cb
      return { unsubscribe: vi.fn() }
    })

    act(() => { config().onConnect() })

    const payload = { type: 'GAME_START', data: { round: 1 } }
    act(() => { msgCb({ body: JSON.stringify(payload) }) })

    expect(onMessage).toHaveBeenCalledWith(payload)
  })

  // 7. send() publishes with Authorization header
  it('send() publishes JSON with Authorization header when connected', () => {
    const { result } = renderStomp()

    act(() => { config().onConnect() })

    act(() => { result.current.send('/app/answer', { answer: 'B' }) })

    expect(client().publish).toHaveBeenCalledWith({
      destination: '/app/answer',
      body: JSON.stringify({ answer: 'B' }),
      headers: { Authorization: 'Bearer test-jwt-token' },
    })
  })

  // 8. send() doesn't send when disconnected
  it('send() does nothing when not connected', () => {
    const { result } = renderStomp()

    // Do NOT trigger onConnect, so connected is false
    act(() => { result.current.send('/app/answer', { answer: 'A' }) })

    expect(client().publish).not.toHaveBeenCalled()
  })

  // 9. Deactivate client on unmount
  it('deactivates the STOMP client on unmount', () => {
    const { unmount } = renderStomp()
    const c = client()

    unmount()

    expect(c.deactivate).toHaveBeenCalledTimes(1)
  })

  // 10. connectHeaders contains Bearer token
  it('passes connectHeaders with Bearer token to STOMP Client', () => {
    renderStomp()

    expect(config().connectHeaders).toEqual({
      Authorization: 'Bearer test-jwt-token',
    })
  })

  // 11. Unsubscribe when roomId changes (effect cleanup + re-create)
  it('deactivates old client and creates new one when roomId changes', () => {
    const { rerender } = renderStomp({ roomId: 'room-1' })
    const oldClient = client()

    act(() => { config().onConnect() })

    rerender({ roomId: 'room-2' })

    expect(oldClient.deactivate).toHaveBeenCalled()
    // New client created and activated
    expect(_clients.length).toBe(2)
    expect(client().activate).toHaveBeenCalled()
  })

  // 12. connected state becomes true after onConnect
  it('sets connected=true after onConnect fires', () => {
    const { result } = renderStomp()

    expect(result.current.connected).toBe(false)

    act(() => { config().onConnect() })

    expect(result.current.connected).toBe(true)
  })

  // 13. reconnecting state management
  it('sets reconnecting=true on WebSocket close after first connect, resets on reconnect', () => {
    const { result } = renderStomp()

    act(() => { config().onConnect() })
    expect(result.current.reconnecting).toBe(false)

    act(() => { config().onWebSocketClose() })
    expect(result.current.connected).toBe(false)
    expect(result.current.reconnecting).toBe(true)

    act(() => { config().onConnect() })
    expect(result.current.connected).toBe(true)
    expect(result.current.reconnecting).toBe(false)
  })

  // 14. Does not set reconnecting when close happens before first connect
  it('does not set reconnecting if close happens before first connect', () => {
    const { result } = renderStomp()

    act(() => { config().onWebSocketClose() })

    expect(result.current.reconnecting).toBe(false)
  })

  // 15. Handles null token gracefully
  it('handles null access token gracefully in connectHeaders', () => {
    vi.mocked(getAccessToken).mockReturnValueOnce(null)

    renderStomp()

    expect(config().connectHeaders).toEqual({
      Authorization: 'Bearer ',
    })
  })

  // 16. Does not subscribe when roomId is undefined
  it('does not subscribe when roomId is undefined', () => {
    renderStomp({ roomId: undefined })

    act(() => { config().onConnect() })

    expect(client().subscribe).not.toHaveBeenCalled()
  })

  // 17. brokerURL uses ws:// derived from http:// API base
  it('derives ws:// brokerURL from http:// API base', () => {
    renderStomp({ url: '/ws' })

    expect(config().brokerURL).toBe('ws://localhost:8080/ws')
  })

  // 18. Malformed JSON in message body does not crash
  it('does not crash on malformed JSON message body', () => {
    const onMessage = vi.fn()
    renderStomp({ onMessage })

    let msgCb: (frame: any) => void = () => {}
    client().subscribe.mockImplementation((_dest: string, cb: (frame: any) => void) => {
      msgCb = cb
      return { unsubscribe: vi.fn() }
    })

    act(() => { config().onConnect() })

    // Should not throw
    act(() => { msgCb({ body: 'not-json{{{' }) })

    expect(onMessage).not.toHaveBeenCalled()
  })
})
