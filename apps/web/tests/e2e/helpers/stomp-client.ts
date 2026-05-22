/**
 * Lightweight STOMP client for e2e gameplay tests.
 *
 * Multiplayer gameplay (round flow, elimination) runs over STOMP — see
 * SPEC_MULTIPLAYER §4. Playwright runs on Node 22 which exposes a global
 * `WebSocket`, so `@stomp/stompjs` connects natively without SockJS.
 *
 * Auth: the server authenticates the STOMP session from the `Authorization`
 * header on the CONNECT frame (same contract as `hooks/useStomp.ts`).
 */
import { Client, type IMessage } from '@stomp/stompjs'

export interface RoomEvent {
  type: string
  data: any
  timestamp?: string
}

const WS_URL = process.env.PLAYWRIGHT_WS_URL ?? 'ws://localhost:8080/ws'

export class StompTestClient {
  private client: Client
  /** Every `/topic/room/{id}` frame received, in arrival order. */
  readonly events: RoomEvent[] = []
  private listeners: Array<(e: RoomEvent) => void> = []

  constructor(
    private readonly token: string,
    private readonly roomId: string,
  ) {
    this.client = new Client({
      brokerURL: WS_URL,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 0, // fail fast in tests — no silent reconnect
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
    })
  }

  connect(timeoutMs = 15000): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`STOMP connect timeout (${this.roomId})`)),
        timeoutMs,
      )
      this.client.onConnect = () => {
        clearTimeout(timer)
        this.client.subscribe(`/topic/room/${this.roomId}`, (frame: IMessage) => {
          try {
            const evt = JSON.parse(frame.body) as RoomEvent
            this.events.push(evt)
            for (const l of this.listeners) l(evt)
          } catch {
            /* ignore non-JSON frames */
          }
        })
        resolve()
      }
      this.client.onStompError = (frame) => {
        clearTimeout(timer)
        reject(new Error(`STOMP error: ${frame.headers.message ?? 'unknown'}`))
      }
      this.client.activate()
    })
  }

  /** Register a listener for future events. */
  onEvent(listener: (e: RoomEvent) => void): void {
    this.listeners.push(listener)
  }

  send(destination: string, payload: unknown): void {
    this.client.publish({
      destination,
      body: JSON.stringify(payload),
      headers: { Authorization: `Bearer ${this.token}` },
    })
  }

  /** Resolve once an event of `type` is seen — checks already-received first. */
  waitForEvent(type: string, timeoutMs = 60000): Promise<RoomEvent> {
    const existing = this.events.find((e) => e.type === type)
    if (existing) return Promise.resolve(existing)
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error(`Timeout waiting for STOMP event ${type}`)),
        timeoutMs,
      )
      this.onEvent((e) => {
        if (e.type === type) {
          clearTimeout(timer)
          resolve(e)
        }
      })
    })
  }

  count(type: string): number {
    return this.events.filter((e) => e.type === type).length
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.deactivate()
    } catch {
      /* already closed */
    }
  }
}
