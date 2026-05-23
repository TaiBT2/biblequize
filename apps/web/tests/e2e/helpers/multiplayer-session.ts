/**
 * MultiplayerSession — orchestration layer cho multi-context WebSocket tests.
 *
 * Wraps an array of StompTestClient (1 per player) với batch ops mà mọi
 * lifecycle/mode-edge/realtime test cần: readyAll, expectEventOnAll,
 * answerAll, disconnectOne (reconnect tests), gracefulCleanup.
 *
 * Pattern lấy ra từ `W-M06-survival-50p.spec.ts` — viết tay 50 dòng connect/
 * ready/answer logic. Helper này giảm xuống ~5 dòng:
 *
 *   const session = await MultiplayerSession.fromRoom(host, players, room.id)
 *   await session.readyAll()
 *   await session.expectEventOnAll('QUESTION_START', { timeoutMs: 10_000 })
 *
 * Source: docs/todo/active/2026-05-23-mp-test-lifecycle-reconnect-kick.md (MPL-0)
 */

import { StompTestClient, type RoomEvent } from './stomp-client'
import type { TestUser } from './multiplayer-api'

export interface SessionPlayer {
  user: TestUser
  client: StompTestClient
}

export class MultiplayerSession {
  readonly observer: StompTestClient | null
  readonly players: SessionPlayer[]
  readonly roomId: string

  private constructor(roomId: string, players: SessionPlayer[], observer: StompTestClient | null) {
    this.roomId = roomId
    this.players = players
    this.observer = observer
  }

  /**
   * Connect 1 STOMP client per player + optional observer client (typically
   * the Quản trò host khi hostPlaysGame=false).
   */
  static async fromRoom(
    observerUser: TestUser | null,
    playerUsers: TestUser[],
    roomId: string,
  ): Promise<MultiplayerSession> {
    const players = playerUsers.map((u) => ({
      user: u,
      client: new StompTestClient(u.token, roomId),
    }))
    const observer = observerUser ? new StompTestClient(observerUser.token, roomId) : null
    await Promise.all([
      ...(observer ? [observer.connect()] : []),
      ...players.map((p) => p.client.connect()),
    ])
    return new MultiplayerSession(roomId, players, observer)
  }

  /** Broadcast `/app/room/{id}/ready` từ mọi player. */
  readyAll(): void {
    for (const p of this.players) {
      p.client.send(`/app/room/${this.roomId}/ready`, {})
    }
  }

  /** Đợi đến khi mọi player client nhận được event `type`. */
  async expectEventOnAll(type: string, opts: { timeoutMs?: number } = {}): Promise<RoomEvent[]> {
    return Promise.all(this.players.map((p) => p.client.waitForEvent(type, opts.timeoutMs ?? 60_000)))
  }

  /** Đợi observer (host quản trò) nhận event — dùng cho QUIZ_END / MATCH_END / GAME_PAUSED. */
  waitForObserver(type: string, timeoutMs = 60_000): Promise<RoomEvent> {
    if (!this.observer) throw new Error('No observer client in this session')
    return this.observer.waitForEvent(type, timeoutMs)
  }

  /**
   * Mỗi player auto-trả lời câu hỏi (dùng cho realtime tests cần ROUND_END).
   * `answerFn(playerIdx, questionIndex) => answerIndex`. Reaction time spread
   * 400-500ms để Speed Race scoring tạo độ chênh deterministic.
   */
  autoAnswer(answerFn: (playerIdx: number, questionIndex: number) => number): void {
    this.players.forEach(({ client }, idx) => {
      client.onEvent((evt) => {
        if (evt.type !== 'QUESTION_START') return
        const qi = evt.data.questionIndex as number
        client.send(`/app/room/${this.roomId}/answer`, {
          questionIndex: qi,
          answerIndex: answerFn(idx, qi),
          reactionTimeMs: 400 + idx,
        })
      })
    })
  }

  /** Drop 1 player client (simulate WS disconnect for reconnect tests). */
  async disconnectOne(idx: number): Promise<void> {
    if (idx < 0 || idx >= this.players.length) throw new Error(`Player ${idx} out of range`)
    await this.players[idx].client.disconnect()
  }

  /** Close every STOMP client. Idempotent — gọi trong try/finally. */
  async cleanup(): Promise<void> {
    await Promise.all([
      ...this.players.map((p) => p.client.disconnect()),
      ...(this.observer ? [this.observer.disconnect()] : []),
    ])
  }

  /** Pretty event count summary cho debugging. */
  summary(): Record<string, number> {
    const types = new Set<string>()
    for (const p of this.players) for (const e of p.client.events) types.add(e.type)
    if (this.observer) for (const e of this.observer.events) types.add(e.type)
    const out: Record<string, number> = {}
    for (const t of types) {
      out[t] = this.observer
        ? this.observer.count(t)
        : this.players.reduce((sum, p) => sum + p.client.count(t), 0)
    }
    return out
  }
}
