/**
 * W-M06-MPM-2 — Battle Royale PLAYER_ELIMINATED payload guarantees
 *
 * Regression for d504299b: FE identifies eliminated self by userId, not
 * username (display-name collision bug). This test pins the BE side of
 * the contract — PLAYER_ELIMINATED WS payload MUST include both userId
 * and username so FE can do safe userId-based identity check.
 *
 * Strategy: 3 BR players, give answers via deterministic answerFn so
 * eventually someone is wrong → PLAYER_ELIMINATED fires. Inspect every
 * such event's data shape.
 *
 * Source: docs/todo/active/2026-05-23-mp-test-mode-edge-quan-tro-chat.md (MPM-2)
 */

import { test, expect } from '@playwright/test'
import {
  provisionUsers, createRoom, joinRoom, startRoom, deleteRoom,
} from '../../helpers/multiplayer-api'
import { MultiplayerSession } from '../../helpers/multiplayer-session'

test.describe('W-M06-MPM-2 BR PLAYER_ELIMINATED payload — L3 @happy-path @multiplayer @battle-royale @websocket', () => {

  test('W-M06-MPM-2-001: PLAYER_ELIMINATED payload includes userId + username (FE identity safety) @write @serial @websocket', async () => {
    test.setTimeout(180_000)

    const [host] = await provisionUsers('e2e-br-elim-host-', 1)
    const players = await provisionUsers('e2e-br-elim-player-', 3)
    let session: MultiplayerSession | undefined
    let roomId: string | undefined

    try {
      const room = await createRoom(host.token, {
        roomName: 'E2E BR identity',
        mode: 'BATTLE_ROYALE', maxPlayers: 10,
        questionCount: 10, timePerQuestion: 6,
        hostPlaysGame: false,
      })
      roomId = room.id

      for (const p of players) {
        const res = await joinRoom(p.token, room.roomCode)
        expect(res.ok).toBe(true)
      }
      session = await MultiplayerSession.fromRoom(host, players, room.id)

      // Each player picks different answer per question → at least 3 of 4
      // options covered each round → one or more wrong → elimination.
      session.autoAnswer((idx, qi) => (idx + qi) % 4)

      session.readyAll()
      await expect
        .poll(async () => {
          const r = await fetch(
            `${process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:8080'}/api/rooms/${room.id}`,
            { headers: { Authorization: `Bearer ${host.token}` } },
          )
          return (await r.json()).room.players.filter((p: { isReady: boolean }) => p.isReady).length
        }, { timeout: 20_000, intervals: [400] })
        .toBe(3)

      await startRoom(host.token, room.id)
      await session.waitForObserver('QUIZ_END', 150_000)

      const elimEvents = session.observer!.events.filter((e) => e.type === 'PLAYER_ELIMINATED')
      expect(elimEvents.length, 'at least 1 elimination expected').toBeGreaterThanOrEqual(1)

      // Contract: every PLAYER_ELIMINATED MUST carry userId + username +
      // rank + activeRemaining (PlayerEliminatedData shape).
      for (const evt of elimEvents) {
        expect(evt.data, 'userId required for FE identity check').toHaveProperty('userId')
        expect(evt.data.userId, 'userId must be non-empty string').toBeTruthy()
        expect(typeof evt.data.userId).toBe('string')
        expect(evt.data, 'username required for toast display').toHaveProperty('username')
        expect(evt.data, 'rank required').toHaveProperty('rank')
        expect(typeof evt.data.rank).toBe('number')
        expect(evt.data, 'activeRemaining required').toHaveProperty('activeRemaining')
      }
    } finally {
      if (session) await session.cleanup()
      if (roomId) await deleteRoom(host.token, roomId)
    }
  })

})
