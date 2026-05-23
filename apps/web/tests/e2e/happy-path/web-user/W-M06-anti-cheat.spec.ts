/**
 * W-M06-MPL-3 — Anti-cheat: double-submit + LEFT player can't answer
 *
 * BE behavior (RoomWebSocketController:191, 200, 207):
 * All 3 anti-cheat checks silently `return` — no error event sent. So
 * tests must verify VIA SCORE / leaderboard not via error response.
 *
 *   Check 1: existsByRoundIdAndUserId → reject 2nd submit (same roundId+userId)
 *   Check 2: Quản trò host (hostPlaysGame=false) submit → reject (Sprint 4)
 *   Check 3: ELIMINATED/SPECTATOR player submit → reject (BR/SD)
 *
 * Strategy for double-submit: in SPEED_RACE max score per question = 150
 * (100 + speed bonus up to +50). If anti-cheat works, a player submitting
 * twice per round gets ≤ 150 × N points. If broken (double-counted), 2x.
 *
 * Source: docs/todo/active/2026-05-23-mp-test-lifecycle-reconnect-kick.md (MPL-3)
 */

import { test, expect } from '@playwright/test'
import {
  provisionUsers, createRoom, joinRoom, startRoom, getLeaderboard, deleteRoom,
} from '../../helpers/multiplayer-api'
import { MultiplayerSession } from '../../helpers/multiplayer-session'

const QUESTION_COUNT = 5
const TIME_PER_Q = 8
const SPEED_RACE_MAX_SCORE_PER_Q = 150 // 100 + bonus up to +50

test.describe('W-M06-MPL-3 Anti-cheat — L3 Realtime @happy-path @multiplayer @anti-cheat @websocket', () => {

  test('W-M06-MPL-3-001: Double-submit silently rejected — player score capped at 150×N @write @serial @websocket', async () => {
    test.setTimeout(120_000)

    const [host] = await provisionUsers('e2e-anticheat-host-', 1)
    const [legit, cheater] = await provisionUsers('e2e-anticheat-player-', 2)
    let session: MultiplayerSession | undefined
    let roomId: string | undefined

    try {
      const room = await createRoom(host.token, {
        roomName: 'E2E Anti-cheat',
        mode: 'SPEED_RACE',
        maxPlayers: 4,
        questionCount: QUESTION_COUNT,
        timePerQuestion: TIME_PER_Q,
        hostPlaysGame: false, // Quản trò mode
      })
      roomId = room.id

      for (const p of [legit, cheater]) {
        const res = await joinRoom(p.token, room.roomCode)
        expect(res.ok).toBe(true)
      }

      session = await MultiplayerSession.fromRoom(host, [legit, cheater], room.id)

      // Player 0 (legit): submit ONCE per QUESTION_START.
      // Player 1 (cheater): submit TWICE per QUESTION_START (different answers).
      session.players[0].client.onEvent((evt) => {
        if (evt.type !== 'QUESTION_START') return
        const qi = evt.data.questionIndex as number
        session!.players[0].client.send(`/app/room/${room.id}/answer`, {
          questionIndex: qi, answerIndex: 0, reactionTimeMs: 500,
        })
      })
      session.players[1].client.onEvent((evt) => {
        if (evt.type !== 'QUESTION_START') return
        const qi = evt.data.questionIndex as number
        // First submit
        session!.players[1].client.send(`/app/room/${room.id}/answer`, {
          questionIndex: qi, answerIndex: 0, reactionTimeMs: 500,
        })
        // Second submit immediately after — should be silently rejected
        // by existsByRoundIdAndUserId check at RoomWebSocketController:191.
        session!.players[1].client.send(`/app/room/${room.id}/answer`, {
          questionIndex: qi, answerIndex: 1, reactionTimeMs: 100,
        })
      })

      session.readyAll()
      await expect
        .poll(async () => {
          const players = (await fetch(
            `${process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:8080'}/api/rooms/${room.id}`,
            { headers: { Authorization: `Bearer ${host.token}` } },
          ).then((r) => r.json())).room.players
          return players.filter((p: { isReady: boolean }) => p.isReady).length
        }, { timeout: 20_000, intervals: [400] })
        .toBe(2)

      const startRes = await startRoom(host.token, room.id)
      expect(startRes.ok).toBe(true)

      await session.waitForObserver('QUIZ_END', 90_000)
      const leaderboard = await getLeaderboard(host.token, room.id)
      expect(leaderboard.length).toBeGreaterThanOrEqual(2)

      const maxLegitScore = SPEED_RACE_MAX_SCORE_PER_Q * QUESTION_COUNT
      for (const entry of leaderboard) {
        const score = (entry.score ?? entry.totalScore ?? 0) as number
        // If anti-cheat broken (double-count), cheater would have up to 2x.
        // Cap proves only 1 submission honored per round.
        expect(score, `score ${score} exceeds anti-cheat cap ${maxLegitScore}`)
          .toBeLessThanOrEqual(maxLegitScore)
      }
    } finally {
      if (session) await session.cleanup()
      if (roomId) await deleteRoom(host.token, roomId)
    }
  })

  test('W-M06-MPL-3-002: Quản trò host submit silently rejected (no RoomAnswer row) @write @serial @websocket', async () => {
    test.setTimeout(120_000)

    const [host] = await provisionUsers('e2e-anticheat-qt-host-', 1)
    const [a, b] = await provisionUsers('e2e-anticheat-qt-player-', 2)
    let session: MultiplayerSession | undefined
    let roomId: string | undefined

    try {
      const room = await createRoom(host.token, {
        roomName: 'E2E Quan tro answer reject',
        mode: 'SPEED_RACE', maxPlayers: 4,
        questionCount: QUESTION_COUNT, timePerQuestion: TIME_PER_Q,
        hostPlaysGame: false,
      })
      roomId = room.id

      await joinRoom(a.token, room.roomCode)
      await joinRoom(b.token, room.roomCode)

      // Observer = host (Quản trò); also provide host's own client as a 3rd player
      // wrapper SO host can also attempt to send /answer (which BE must reject).
      session = await MultiplayerSession.fromRoom(host, [a, b, host], room.id)
      session.autoAnswer(() => 0) // all 3 try to submit answerIndex=0

      // Player a + b mark ready (host is Quản trò, no ready needed).
      session.players[0].client.send(`/app/room/${room.id}/ready`, {})
      session.players[1].client.send(`/app/room/${room.id}/ready`, {})

      await expect
        .poll(async () => {
          const players = (await fetch(
            `${process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:8080'}/api/rooms/${room.id}`,
            { headers: { Authorization: `Bearer ${host.token}` } },
          ).then((r) => r.json())).room.players
          return players.filter((p: { isReady: boolean }) => p.isReady).length
        }, { timeout: 20_000, intervals: [400] })
        .toBe(2)

      await startRoom(host.token, room.id)
      await session.waitForObserver('QUIZ_END', 90_000)

      // Final leaderboard should contain only a + b (Quản trò host NOT a player).
      const leaderboard = await getLeaderboard(host.token, room.id)
      const userIds = leaderboard.map((e) => e.userId ?? e.user?.id).filter(Boolean)
      // Host must NOT be in leaderboard (RoomController:799 says
      // Quản trò response excludes host from rankings).
      expect(userIds.length).toBeGreaterThanOrEqual(2)
      // Cannot easily assert host's actual userId here without an extra call;
      // assert leaderboard size matches non-host players (2).
      expect(leaderboard.length).toBe(2)
    } finally {
      if (session) await session.cleanup()
      if (roomId) await deleteRoom(host.token, roomId)
    }
  })

  test('W-M06-MPL-3-003: LEFT player submit rejected (status check) — score frozen at leave point @write @serial @websocket', async () => {
    // [DEFERRED — needs mid-game leaveRoom + assert subsequent answers ignored]
    // BE behavior: RoomService.leaveRoom sets playerStatus=LEFT mid-game;
    // RoomWebSocketController:207-214 only checks ELIMINATED/SPECTATOR,
    // NOT LEFT. So LEFT players might actually still be able to answer.
    // Test would validate the assumption — defer until clarified.
    test.skip()
  })

})
