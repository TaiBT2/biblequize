/**
 * W-M06-QM-SD — Đấu Nhanh SUDDEN_DEATH mode L2 ("Đấu vương")
 *
 * Mode rule (SPEC_MULTIPLAYER §3.4): 3-10 players, queue king-of-the-hill
 * 1v1. Sai-trước-thua; cả-2-đúng/sai = hoà tiếp; CLOSE_THRESHOLD_MS=200ms;
 * MAX_CONTINUES=3 tie-break trước khi force loss theo averageReactionTime.
 * Champion cuối = finalRank 1. WS events MATCH_START / MATCH_END /
 * SD_QUEUE_UPDATE. KHÔNG dùng questionCount (chạy đến còn 1 người).
 *
 * L3 realtime needs ≥3 contexts (queue + champion + challenger); stubbed.
 */

import { test, expect } from '../../fixtures/auth'

const QM_ENDPOINT = '/api/rooms/quick-match'

test.describe('W-M06-QM SUDDEN_DEATH @happy-path @multiplayer @quickmatch @mode-sudden-death', () => {

  test('W-M06-QM-SD-001: POST SUDDEN_DEATH → mode đúng (questionCount irrelevant) @quickmatch @write', async ({ tier3Page }) => {
    const page = tier3Page
    const res = await page.request.post(QM_ENDPOINT, {
      data: { mode: 'SUDDEN_DEATH', bookScope: 'ALL', questionCount: 20, timePerQuestion: 15, source: 'DATABASE' },
    })
    if (res.status() === 422) {
      const b = await res.json()
      test.skip(b.error === 'DAILY_CAP_REACHED', 'Daily cap hit before this test')
    }
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.room.mode).toBe('SUDDEN_DEATH')
    expect(body.room.timePerQuestion).toBe(15)
    // 3-10 player range per spec §3.4.
    expect(body.room.maxPlayers).toBeGreaterThanOrEqual(3)
    expect(body.room.maxPlayers).toBeLessThanOrEqual(10)

    await page.request.delete(`/api/rooms/${body.room.id}`)
  })

  test('W-M06-QM-SD-L3-001: 3 players, queue init — 2 đầu ACTIVE + còn lại SPECTATOR @quickmatch @realtime', async () => {
    // [DEFERRED — WEBSOCKET INFRASTRUCTURE]
    // Assert SuddenDeathMatchService.initializeQueue (line 47): sort
    // joinedAt → first 2 = ACTIVE, rest SPECTATOR, winningStreak=0,
    // MATCH_START broadcast.
    test.skip()
  })

  test('W-M06-QM-SD-L3-002: Sai-trước-thua → MATCH_END, loser SPECTATOR, next challenger ACTIVE @quickmatch @realtime', async () => {
    // [DEFERRED — WEBSOCKET INFRASTRUCTURE]
    // Core sudden death rule. Champion streak += 1; queue advances.
    test.skip()
  })

  test('W-M06-QM-SD-L3-003: Cả 2 đúng/sai → hoà, câu kế cùng matchup, MAX_CONTINUES tie-break @quickmatch @realtime', async () => {
    // [DEFERRED — WEBSOCKET INFRASTRUCTURE]
    // Verify CLOSE_THRESHOLD_MS=200, MAX_CONTINUES=3 force loss theo
    // averageReactionTime cao hơn.
    test.skip()
  })

  test('W-M06-QM-SD-L3-004: Queue rỗng + còn 1 champion → game end, finalRank champion=1 @quickmatch @realtime', async () => {
    // [DEFERRED — WEBSOCKET INFRASTRUCTURE]
    // End-of-game terminal state.
    test.skip()
  })

})
