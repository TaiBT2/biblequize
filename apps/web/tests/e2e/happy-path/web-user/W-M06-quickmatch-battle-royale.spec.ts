/**
 * W-M06-QM-BR — Đấu Nhanh BATTLE_ROYALE mode L2
 *
 * Mode rule (SPEC_MULTIPLAYER §3.2): 3-100 players (cap raised 2026-05-22),
 * wrong → ELIMINATED, all-wrong = amnesty round, last man standing wins.
 * WS events PLAYER_ELIMINATED / BATTLE_ROYALE_UPDATE.
 *
 * L3 realtime elimination needs ≥2 contexts; stubbed.
 */

import { test, expect } from '../../fixtures/auth'

const QM_ENDPOINT = '/api/rooms/quick-match'

test.describe('W-M06-QM BATTLE_ROYALE @happy-path @multiplayer @quickmatch @mode-battle-royale', () => {

  test('W-M06-QM-BR-001: POST BATTLE_ROYALE → mode + defaults @quickmatch @write', async ({ tier3Page }) => {
    const page = tier3Page
    const res = await page.request.post(QM_ENDPOINT, {
      data: { mode: 'BATTLE_ROYALE', bookScope: 'ALL', questionCount: 20, timePerQuestion: 20, source: 'DATABASE' },
    })
    if (res.status() === 422) {
      const b = await res.json()
      test.skip(b.error === 'DAILY_CAP_REACHED', 'Daily cap hit before this test')
    }
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.room.mode).toBe('BATTLE_ROYALE')
    expect(body.room.totalQuestions ?? body.room.questionCount).toBe(20)
    expect(body.room.timePerQuestion).toBe(20)
    // BR allowed up to 100 (DECISIONS.md 2026-05-22 cap raise).
    expect(body.room.maxPlayers).toBeGreaterThanOrEqual(3)

    await page.request.delete(`/api/rooms/${body.room.id}`)
  })

  test('W-M06-QM-BR-L3-001: Wrong answer → PLAYER_ELIMINATED, không nhận QUESTION_START tiếp @quickmatch @realtime', async () => {
    // [DEFERRED — WEBSOCKET INFRASTRUCTURE]
    // Verify ELIMINATED status flow + amnesty round (all-wrong = no
    // elimination per SPEC_MULTIPLAYER:261). Pattern: 2 contexts, one
    // submits wrong answer deliberately.
    test.skip()
  })

  test('W-M06-QM-BR-L3-002: All-wrong amnesty round — không loại ai @quickmatch @realtime', async () => {
    // [DEFERRED — WEBSOCKET INFRASTRUCTURE]
    // Critical edge case from BattleRoyaleEngine.processRoundEnd.
    test.skip()
  })

})
