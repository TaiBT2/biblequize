/**
 * W-M06-MPM-6+ — Quản trò host nhận ANSWER_SUBMITTED + SCORE_UPDATE
 *
 * User report 2026-05-23: chơi BATTLE_ROYALE, player trả lời đúng nhưng
 * màn host vẫn "0 / N đã trả lời, chưa có ai trả lời".
 *
 * Hypothesis: host subscribe /topic/room/{id} (cùng topic với player) nên
 * VỀ LÝ THUYẾT phải nhận mọi broadcast bao gồm ANSWER_SUBMITTED + SCORE_UPDATE
 * (RoomWebSocketController:290, :273+:398). Test này pin contract — nếu fail
 * → BE đang skip broadcast cho host listener (bug); nếu pass → bug ở FE
 * subscription/handler timing và cần debug bằng devtools.
 *
 * Source: docs/todo/active/2026-05-23-mp-test-mode-edge-quan-tro-chat.md (MPM-6+)
 */

import { test, expect } from '@playwright/test'
import {
  provisionUsers, createRoom, joinRoom, startRoom, deleteRoom,
} from '../../helpers/multiplayer-api'
import { MultiplayerSession } from '../../helpers/multiplayer-session'

test.describe('W-M06 Host receives player events — L3 @happy-path @multiplayer @quan-tro @websocket', () => {

  test('W-M06-MPM-6+: Quản trò observer receives ANSWER_SUBMITTED + SCORE_UPDATE từ player submissions @write @serial @websocket', async () => {
    test.setTimeout(120_000)

    const [host] = await provisionUsers('e2e-host-events-host-', 1)
    const players = await provisionUsers('e2e-host-events-player-', 3)
    let session: MultiplayerSession | undefined
    let roomId: string | undefined

    try {
      const room = await createRoom(host.token, {
        roomName: 'E2E Host events BR',
        mode: 'BATTLE_ROYALE', maxPlayers: 10,
        questionCount: 5, timePerQuestion: 6,
        hostPlaysGame: false, // Quản trò mode — host observer only
      })
      roomId = room.id

      for (const p of players) {
        const res = await joinRoom(p.token, room.roomCode)
        expect(res.ok).toBe(true)
      }

      session = await MultiplayerSession.fromRoom(host, players, room.id)
      // Each player picks deterministic different answers — some right, some
      // wrong each round — to maximize ANSWER_SUBMITTED + SCORE_UPDATE traffic.
      session.autoAnswer((idx, qi) => (idx + qi) % 4)

      session.readyAll()
      await expect
        .poll(async () => {
          const r = await fetch(
            `${process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:8080'}/api/rooms/${room.id}`,
            { headers: { Authorization: `Bearer ${host.token}` } },
          )
          return (await r.json()).room.players.filter(
            (p: { isReady: boolean }) => p.isReady,
          ).length
        }, { timeout: 20_000, intervals: [400] })
        .toBe(3)

      await startRoom(host.token, room.id)
      await session.waitForObserver('QUIZ_END', 90_000)

      // ── Core regression assertion ─────────────────────────────────────
      // Host observer subscribes /topic/room/{id} qua MultiplayerSession.
      // Mỗi player submit (3 players × N rounds before elimination) phải
      // sinh ra 1 ANSWER_SUBMITTED + 1 SCORE_UPDATE trên topic.
      const answerSubmitted = session.observer!.count('ANSWER_SUBMITTED')
      const scoreUpdate = session.observer!.count('SCORE_UPDATE')

      // At least 1 of each must arrive — proves BE doesn't filter out host.
      expect(answerSubmitted, 'host MUST receive ANSWER_SUBMITTED (line 290 broadcast)')
        .toBeGreaterThanOrEqual(1)
      expect(scoreUpdate, 'host MUST receive SCORE_UPDATE (line 398 broadcast)')
        .toBeGreaterThanOrEqual(1)

      // Payload contract: ANSWER_SUBMITTED must include playerId + username +
      // isCorrect (host UI uses these to populate "Tình trạng trả lời").
      const firstAnswer = session.observer!.events.find((e) => e.type === 'ANSWER_SUBMITTED')
      expect(firstAnswer?.data, 'playerId required').toHaveProperty('playerId')
      expect(firstAnswer?.data, 'username required').toHaveProperty('username')
      expect(firstAnswer?.data, 'isCorrect required').toHaveProperty('isCorrect')

      // eslint-disable-next-line no-console
      console.log(
        `[host-answer-events] ANSWER_SUBMITTED=${answerSubmitted} ` +
          `SCORE_UPDATE=${scoreUpdate} QUESTION_START=${session.observer!.count('QUESTION_START')}`,
      )
    } finally {
      if (session) await session.cleanup()
      if (roomId) await deleteRoom(host.token, roomId)
    }
  })

})
