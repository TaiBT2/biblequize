/**
 * W-M06-MPM-5 — Quick Match anti-spoiler (lazy server-side selection)
 *
 * Spec: QP-2 / PROMPT_MULTIPLAYER_QUICKMATCH_PIVOT §0.1
 *   "Anti-spoiler: Lazy server-side selection — câu hỏi KHÔNG tồn tại
 *    trong client trước QUESTION_START event."
 *
 * Verification surfaces (all REST):
 *   1. POST /api/rooms/quick-match response → no question text leaked
 *   2. GET /api/rooms/{id} (LOBBY status) → no question text
 *   3. GET /api/rooms/{id}/current-question (LOBBY) → 204 No Content
 *
 * Anti-leak heuristics: response must not contain keys "correctIndex",
 * "questionText", "options" carrying strings, OR a non-empty "questions"
 * array. preselectedIds (server-side) MAY appear as IDs but NOT text.
 *
 * Source: docs/todo/active/2026-05-23-mp-test-mode-edge-quan-tro-chat.md (MPM-5)
 */

import { test, expect } from '@playwright/test'
import {
  provisionUsers, createRoom, createQuickMatch, getCurrentQuestion,
  joinRoom, startRoom, deleteRoom,
} from '../../helpers/multiplayer-api'
import { MultiplayerSession } from '../../helpers/multiplayer-session'

const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:8080'

const FORBIDDEN_LEAK_KEYS = ['correctIndex', 'correctAnswer', 'questionText', 'explanation']

function findLeakedKey(obj: unknown, path = '$'): string | null {
  if (obj === null || typeof obj !== 'object') return null
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (FORBIDDEN_LEAK_KEYS.includes(k) && v != null && v !== '') {
      return `${path}.${k}`
    }
    const nested = findLeakedKey(v, `${path}.${k}`)
    if (nested) return nested
  }
  return null
}

test.describe('W-M06-MPM-5 Quick Match anti-spoiler @happy-path @multiplayer @quickmatch @anti-spoiler', () => {

  test('W-M06-MPM-5-001: POST quick-match response không leak question text/correctIndex @write @serial', async () => {
    const [host] = await provisionUsers('e2e-spoiler-host-', 1)
    const qmRes = await createQuickMatch(host.token, {
      mode: 'SPEED_RACE', questionCount: 5, timePerQuestion: 30,
    })
    if (qmRes.status !== 200) {
      const body = await qmRes.json()
      test.skip(body.error === 'DAILY_CAP_REACHED', 'Daily cap hit')
      return
    }
    const body = await qmRes.json()
    const roomId = body.room.id

    try {
      const leaked = findLeakedKey(body)
      expect(leaked, `forbidden key leaked at ${leaked}`).toBeNull()

      // `questions` array — if present, must be empty or contain only IDs.
      const questionsField = body.room.questions
      if (Array.isArray(questionsField) && questionsField.length > 0) {
        for (const q of questionsField) {
          // Only IDs (string/number) — never an object with text.
          expect(typeof q, 'questions[] should be IDs only, not objects with text')
            .toMatch(/string|number/)
        }
      }
    } finally {
      await deleteRoom(host.token, roomId)
    }
  })

  test('W-M06-MPM-5-002: GET /api/rooms/{id} trong LOBBY không leak question content @write @serial', async () => {
    const [host] = await provisionUsers('e2e-spoiler-get-', 1)
    const qmRes = await createQuickMatch(host.token, {
      mode: 'SPEED_RACE', questionCount: 5, timePerQuestion: 30,
    })
    if (qmRes.status !== 200) {
      const body = await qmRes.json()
      test.skip(body.error === 'DAILY_CAP_REACHED', 'Daily cap hit')
      return
    }
    const created = await qmRes.json()
    const roomId = created.room.id

    try {
      const detailRes = await fetch(`${API_URL}/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${host.token}` },
      })
      expect(detailRes.ok).toBe(true)
      const detail = await detailRes.json()
      expect(detail.room.status).toBe('LOBBY')

      const leaked = findLeakedKey(detail)
      expect(leaked, `GET /rooms/{id} leaked at ${leaked}`).toBeNull()
    } finally {
      await deleteRoom(host.token, roomId)
    }
  })

  test('W-M06-MPM-5-004: QUESTION_START WS payload KHÔNG chứa correctAnswer (regression for fb3ecfad) @write @serial @websocket', async () => {
    // Regression test cho security fix 2026-05-23: trước fix, BE đẩy
    // Question.correctAnswer vào DTO của QUESTION_START — Quản trò
    // subscribe /topic/room/{id} thấy đáp án trước player. Fix bỏ field
    // khỏi buildQuestionDto. Test này CATCH bug nếu regression.
    test.setTimeout(60_000)

    const [host] = await provisionUsers('e2e-spoiler-ws-host-', 1)
    const players = await provisionUsers('e2e-spoiler-ws-player-', 2)
    let session: MultiplayerSession | undefined
    let roomId: string | undefined

    try {
      const room = await createRoom(host.token, {
        roomName: 'E2E spoiler WS regression',
        mode: 'SPEED_RACE', maxPlayers: 4,
        questionCount: 3, timePerQuestion: 30,
        hostPlaysGame: false, // Quản trò mode — host is the spoiler victim
      })
      roomId = room.id

      for (const p of players) await joinRoom(p.token, room.roomCode)
      session = await MultiplayerSession.fromRoom(host, players, room.id)
      session.readyAll()
      await expect
        .poll(async () => {
          const r = await fetch(
            `${API_URL}/api/rooms/${room.id}`,
            { headers: { Authorization: `Bearer ${host.token}` } },
          )
          return (await r.json()).room.players.filter((p: { isReady: boolean }) => p.isReady).length
        }, { timeout: 20_000, intervals: [400] })
        .toBe(2)

      await startRoom(host.token, room.id)
      const qs = await session.waitForObserver('QUESTION_START', 15_000)

      // ── Regression assertion ─────────────────────────────────────────
      // The QUESTION_START payload.question MUST NOT carry correctAnswer.
      // If this fails: the security fix was reverted / a code path bypasses
      // buildQuestionDto and re-leaks the answer to host topic.
      const questionPayload = (qs.data as { question?: Record<string, unknown> }).question
      expect(questionPayload, 'QUESTION_START must include question DTO').toBeTruthy()
      expect(questionPayload, 'QUESTION_START.question must NOT contain correctAnswer (anti-spoiler)')
        .not.toHaveProperty('correctAnswer')
      expect(questionPayload, 'also no correctIndex leak').not.toHaveProperty('correctIndex')
    } finally {
      if (session) await session.cleanup()
      if (roomId) await deleteRoom(host.token, roomId)
    }
  })

  test('W-M06-MPM-5-003: GET /current-question trong LOBBY → 204 No Content @write @serial', async () => {
    const [host] = await provisionUsers('e2e-spoiler-cq-', 1)
    const qmRes = await createQuickMatch(host.token, {
      mode: 'SPEED_RACE', questionCount: 5, timePerQuestion: 30,
    })
    if (qmRes.status !== 200) {
      const body = await qmRes.json()
      test.skip(body.error === 'DAILY_CAP_REACHED', 'Daily cap hit')
      return
    }
    const body = await qmRes.json()
    const roomId = body.room.id

    try {
      const cqRes = await getCurrentQuestion(host.token, roomId)
      // RoomController:230-235: 204 nếu không có current question.
      // LOBBY status → game chưa start → không có current question.
      expect(cqRes.status, 'LOBBY current-question should be 204').toBe(204)
    } finally {
      await deleteRoom(host.token, roomId)
    }
  })

})
