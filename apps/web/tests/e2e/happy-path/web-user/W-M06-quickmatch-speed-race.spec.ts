/**
 * W-M06-QM-SR — Đấu Nhanh SPEED_RACE mode L2
 *
 * Mode rule (SPEC_MULTIPLAYER §3.1): 2-10 players, score 100 + speed
 * bonus floor((timeLimit_ms - responseMs) / timeLimit_ms × 50), max 150.
 * Win = highest total. WS events ROUND_END / QUIZ_END.
 *
 * L3 realtime scoring needs ≥2 contexts; stubbed as test.skip() until
 * shared WS helper available (see W-M06-survival-50p.spec.ts pattern).
 */

import { test, expect } from '../../fixtures/auth'

const QM_ENDPOINT = '/api/rooms/quick-match'

test.describe('W-M06-QM SPEED_RACE @happy-path @multiplayer @quickmatch @mode-speed-race', () => {

  test('W-M06-QM-SR-001: POST SPEED_RACE → defaults áp dụng @quickmatch @write', async ({ tier3Page }) => {
    const page = tier3Page
    const res = await page.request.post(QM_ENDPOINT, {
      data: { mode: 'SPEED_RACE', bookScope: 'ALL', questionCount: 15, timePerQuestion: 30, source: 'DATABASE' },
    })
    if (res.status() === 422) {
      const b = await res.json()
      test.skip(b.error === 'DAILY_CAP_REACHED', 'Daily cap hit before this test')
    }
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.room.mode).toBe('SPEED_RACE')
    expect(body.room.totalQuestions ?? body.room.questionCount).toBe(15)
    expect(body.room.timePerQuestion).toBe(30)
    expect(body.room.maxPlayers).toBeGreaterThanOrEqual(2)
    expect(body.room.maxPlayers).toBeLessThanOrEqual(10)

    await page.request.delete(`/api/rooms/${body.room.id}`)
  })

  test('W-M06-QM-SR-L3-001: 2 players, faster correct → higher score (REALTIME) @quickmatch @realtime', async () => {
    // [DEFERRED — WEBSOCKET INFRASTRUCTURE]
    // Needs 2 browser contexts joined to same room, WS QUESTION_START
    // synchronization, answer-submit timing. Pattern: see
    // W-M06-survival-50p.spec.ts. Implement after shared WS helper.
    test.skip()
  })

})
