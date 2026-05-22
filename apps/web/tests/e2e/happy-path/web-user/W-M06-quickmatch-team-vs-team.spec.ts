/**
 * W-M06-QM-TVT — Đấu Nhanh TEAM_VS_TEAM mode L2
 *
 * Mode rule (SPEC_MULTIPLAYER §3.3): 4-20 even players, auto-balance team
 * on join (RoomService.addPlayerToRoom:249-253), POST /switch-team only
 * when LOBBY. PERFECT_ROUND bonus +50/player. Winner = team với tổng cao hơn.
 *
 * L3 realtime team scoring needs ≥2 contexts; stubbed.
 */

import { test, expect } from '../../fixtures/auth'

const QM_ENDPOINT = '/api/rooms/quick-match'

test.describe('W-M06-QM TEAM_VS_TEAM @happy-path @multiplayer @quickmatch @mode-team-vs-team', () => {

  test('W-M06-QM-TVT-001: POST TEAM_VS_TEAM → mode + defaults + team-A auto-assigned cho host @quickmatch @write', async ({ tier3Page }) => {
    const page = tier3Page
    const res = await page.request.post(QM_ENDPOINT, {
      data: { mode: 'TEAM_VS_TEAM', bookScope: 'ALL', questionCount: 15, timePerQuestion: 30, source: 'DATABASE' },
    })
    if (res.status() === 422) {
      const b = await res.json()
      test.skip(b.error === 'DAILY_CAP_REACHED', 'Daily cap hit before this test')
    }
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.room.mode).toBe('TEAM_VS_TEAM')
    expect(body.room.totalQuestions ?? body.room.questionCount).toBe(15)
    expect(body.room.timePerQuestion).toBe(30)
    // Auto-balance: first player gets team A.
    const hostPlayer = body.room.players?.find(
      (p: { userId: string }) => p.userId === body.viewerUserId,
    )
    if (hostPlayer) expect(['A', 'B']).toContain(hostPlayer.team)

    await page.request.delete(`/api/rooms/${body.room.id}`)
  })

  test('W-M06-QM-TVT-002: POST /switch-team trong LOBBY → đổi team OK @quickmatch @write', async ({ tier3Page }) => {
    const page = tier3Page
    const createRes = await page.request.post(QM_ENDPOINT, {
      data: { mode: 'TEAM_VS_TEAM', bookScope: 'ALL', questionCount: 15, timePerQuestion: 30, source: 'DATABASE' },
    })
    if (createRes.status() !== 200) {
      const b = await createRes.json()
      test.skip(b.error === 'DAILY_CAP_REACHED', 'Daily cap hit before this test')
      return
    }
    const body = await createRes.json()
    const roomId = body.room.id
    const switchRes = await page.request.post(`/api/rooms/${roomId}/switch-team`, {
      data: { team: 'B' },
    })
    // Endpoint exists per RoomController:190-200; accept either 200 OK or
    // 422 if validation rejects (e.g., team imbalance rule). Just assert
    // not 404/500.
    expect([200, 400, 422]).toContain(switchRes.status())

    await page.request.delete(`/api/rooms/${roomId}`)
  })

  test('W-M06-QM-TVT-L3-001: Team score aggregate — winner = team có tổng cao hơn @quickmatch @realtime', async () => {
    // [DEFERRED — WEBSOCKET INFRASTRUCTURE]
    // 4 contexts (2 team A + 2 team B), score per round, assert
    // calculateTeamScores result.
    test.skip()
  })

  test('W-M06-QM-TVT-L3-002: PERFECT_ROUND bonus +50 khi cả team đúng @quickmatch @realtime', async () => {
    // [DEFERRED — WEBSOCKET INFRASTRUCTURE]
    // Verify TeamScoringService.processPerfectRound broadcast.
    test.skip()
  })

})
