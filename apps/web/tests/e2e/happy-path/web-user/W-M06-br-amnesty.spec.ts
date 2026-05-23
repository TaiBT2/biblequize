/**
 * W-M06-MPM-1 — Battle Royale all-wrong amnesty round (no eliminations)
 *
 * Spec: SPEC_MULTIPLAYER §3.2 (verified 2026-05-09)
 *   "nếu TẤT CẢ active đều sai → không loại ai (round 'ân xá')"
 *
 * BE: BattleRoyaleEngine.processRoundEnd — checks if `correctAnswerers`
 * empty → skip elimination, broadcast empty PLAYER_ELIMINATED batch.
 *
 * Strategy: 3 players, NOBODY submits → timeout → `correctAnswerers` empty
 * for every round → amnesty fires for every round → 0 eliminations after
 * all N rounds. Deterministic (no probabilistic guessing of correctIndex).
 *
 * Source: docs/todo/active/2026-05-23-mp-test-mode-edge-quan-tro-chat.md (MPM-1)
 */

import { test, expect } from '@playwright/test'
import {
  provisionUsers, createRoom, joinRoom, startRoom, getLeaderboard, deleteRoom,
} from '../../helpers/multiplayer-api'
import { MultiplayerSession } from '../../helpers/multiplayer-session'

const QUESTION_COUNT = 5
const TIME_PER_Q = 6 // short → fast amnesty rounds

test.describe('W-M06-MPM-1 BR amnesty — L3 @happy-path @multiplayer @battle-royale @websocket', () => {

  test('W-M06-MPM-1-001: All-wrong every round (timeout) → 0 PLAYER_ELIMINATED, all 3 ACTIVE at end @write @serial @websocket', async () => {
    test.setTimeout(120_000)

    const [host] = await provisionUsers('e2e-br-amnesty-host-', 1)
    const players = await provisionUsers('e2e-br-amnesty-player-', 3) // BR minimum = 3
    let session: MultiplayerSession | undefined
    let roomId: string | undefined

    try {
      const room = await createRoom(host.token, {
        roomName: 'E2E BR amnesty',
        mode: 'BATTLE_ROYALE', maxPlayers: 10,
        questionCount: QUESTION_COUNT, timePerQuestion: TIME_PER_Q,
        hostPlaysGame: false,
      })
      roomId = room.id

      for (const p of players) {
        const res = await joinRoom(p.token, room.roomCode)
        expect(res.ok).toBe(true)
      }

      session = await MultiplayerSession.fromRoom(host, players, room.id)
      // CRITICAL: do NOT call autoAnswer — players stay silent, every round
      // ends with empty correctAnswerers → amnesty.

      session.readyAll()
      await expect
        .poll(async () => {
          const res = await fetch(
            `${process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:8080'}/api/rooms/${room.id}`,
            { headers: { Authorization: `Bearer ${host.token}` } },
          )
          const body = await res.json()
          return body.room.players.filter((p: { isReady: boolean }) => p.isReady).length
        }, { timeout: 20_000, intervals: [400] })
        .toBe(3)

      await startRoom(host.token, room.id)
      await session.waitForObserver('QUIZ_END', 90_000)

      // ── Amnesty assertions ──────────────────────────────────────────────

      // 0 PLAYER_ELIMINATED events broadcast (observer sees every event).
      const eliminated = session.observer!.count('PLAYER_ELIMINATED')
      expect(eliminated, 'amnesty: no eliminations when all players timeout').toBe(0)

      // BATTLE_ROYALE_UPDATE should still broadcast with activeCount stable
      // at 3 across all rounds.
      const brUpdates = session.observer!.events.filter((e) => e.type === 'BATTLE_ROYALE_UPDATE')
      expect(brUpdates.length, 'BR_UPDATE should fire each round').toBeGreaterThan(0)
      for (const update of brUpdates) {
        expect(update.data.activeCount, 'activeCount stays at 3 throughout amnesty').toBe(3)
      }

      // Leaderboard: all 3 players present, none ELIMINATED.
      const leaderboard = await getLeaderboard(host.token, room.id)
      expect(leaderboard.length).toBe(3)
      for (const entry of leaderboard) {
        const status = (entry.playerStatus ?? entry.status) as string | undefined
        if (status) expect(status).not.toBe('ELIMINATED')
      }
    } finally {
      if (session) await session.cleanup()
      if (roomId) await deleteRoom(host.token, roomId)
    }
  })

})
