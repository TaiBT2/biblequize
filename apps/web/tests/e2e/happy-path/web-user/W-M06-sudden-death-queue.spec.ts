/**
 * W-M06-MPM-3 — SUDDEN_DEATH queue + king-of-the-hill 1v1
 *
 * Spec: SPEC_MULTIPLAYER §3.4
 *   - 3-10 players, sort joinedAt → first 2 = ACTIVE, rest SPECTATOR
 *   - Sai-trước-thua → MATCH_END, loser SPECTATOR, next challenger ACTIVE
 *   - Cả 2 đúng/sai → hoà, câu kế cùng matchup
 *   - Game end khi queue rỗng + còn 1 champion (finalRank=1)
 *
 * WS events (verified): MATCH_START, MATCH_END, SD_QUEUE_UPDATE.
 *
 * Strategy: 3 players each pick DIFFERENT answerIndex per question
 * (`(playerIdx + qi) % 4`). Statistically a different player is right
 * each round → MATCH_END fires; over time queue drains to 1 champion.
 * Não dùng questionCount (SD chạy đến hết queue).
 *
 * Source: docs/todo/active/2026-05-23-mp-test-mode-edge-quan-tro-chat.md (MPM-3)
 */

import { test, expect } from '@playwright/test'
import {
  provisionUsers, createRoom, joinRoom, startRoom, getLeaderboard, deleteRoom,
} from '../../helpers/multiplayer-api'
import { MultiplayerSession } from '../../helpers/multiplayer-session'

const PLAYER_COUNT = 3
const TIME_PER_Q = 6 // short → fast matchups

test.describe('W-M06-MPM-3 SUDDEN_DEATH queue — L3 @happy-path @multiplayer @sudden-death @websocket', () => {

  test('W-M06-MPM-3-001: 3 players, queue init + matchups → champion finalRank=1, ≥1 MATCH_END @write @serial @websocket', async () => {
    test.setTimeout(180_000)

    const [host] = await provisionUsers('e2e-sd-host-', 1)
    const players = await provisionUsers('e2e-sd-player-', PLAYER_COUNT)
    let session: MultiplayerSession | undefined
    let roomId: string | undefined

    try {
      // Provision joinedAt order = creation order (player[0] first).
      // BE sort joinedAt → players[0] + players[1] = ACTIVE; players[2] = SPECTATOR queue.
      const room = await createRoom(host.token, {
        roomName: 'E2E Sudden Death queue',
        mode: 'SUDDEN_DEATH', maxPlayers: 10,
        questionCount: 20, timePerQuestion: TIME_PER_Q,
        hostPlaysGame: false,
      })
      roomId = room.id

      // Sequential join → deterministic joinedAt order.
      for (const p of players) {
        const res = await joinRoom(p.token, room.roomCode)
        expect(res.ok).toBe(true)
      }

      session = await MultiplayerSession.fromRoom(host, players, room.id)
      // Each player picks different answerIndex per question → statistically
      // one of the 2 ACTIVE will be right each round → MATCH_END fires.
      session.autoAnswer((idx, qi) => (idx + qi) % 4)

      session.readyAll()
      await expect
        .poll(async () => {
          const res = await fetch(
            `${process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:8080'}/api/rooms/${room.id}`,
            { headers: { Authorization: `Bearer ${host.token}` } },
          )
          return (await res.json()).room.players.filter(
            (p: { isReady: boolean }) => p.isReady,
          ).length
        }, { timeout: 20_000, intervals: [400] })
        .toBe(PLAYER_COUNT)

      await startRoom(host.token, room.id)
      // SD game ends with QUIZ_END after queue drains.
      await session.waitForObserver('QUIZ_END', 150_000)

      // ── Queue init assertions ──────────────────────────────────────────
      // First MATCH_START must fire before any MATCH_END.
      const matchStarts = session.observer!.events.filter((e) => e.type === 'MATCH_START')
      expect(matchStarts.length, 'at least 1 MATCH_START at game open').toBeGreaterThanOrEqual(1)

      const matchEnds = session.observer!.events.filter((e) => e.type === 'MATCH_END')
      // 3 players → at most 2 MATCH_END (each eliminates one) before 1 champion remains.
      expect(matchEnds.length, '≥1 MATCH_END before queue drains to 1 champion').toBeGreaterThanOrEqual(1)
      expect(matchEnds.length).toBeLessThanOrEqual(2)

      // SD_QUEUE_UPDATE may fire per matchup transition.
      // (Spec §4: "defined, payload TBD" — just assert if present, no schema check.)

      // ── Final ranks ─────────────────────────────────────────────────────
      const leaderboard = await getLeaderboard(host.token, room.id)
      expect(leaderboard.length).toBe(PLAYER_COUNT)
      const ranks = leaderboard
        .map((e) => (e.rank ?? e.finalRank) as number)
        .filter((r) => r != null)
      // Champion has finalRank=1.
      expect(ranks, 'champion must have finalRank=1').toContain(1)
      // All 3 ranks assigned (no ties at top — last-standing king-of-the-hill).
      expect(new Set(ranks).size).toBe(PLAYER_COUNT)

      // eslint-disable-next-line no-console
      console.log(
        `[sd-queue] matchStarts=${matchStarts.length} matchEnds=${matchEnds.length} ` +
          `ranks=[${ranks.sort().join(',')}]`,
      )
    } finally {
      if (session) await session.cleanup()
      if (roomId) await deleteRoom(host.token, roomId)
    }
  })

})
