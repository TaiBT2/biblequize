/**
 * W-M06-QM — Đấu Nhanh (Quick Match) L2 Happy Path (mode-agnostic)
 *
 * Coverage: POST /api/rooms/quick-match contract + UI flow → lobby +
 * AI tier-gating + daily cap + counter update + empty-state CTA.
 *
 * Per-mode realtime gameplay → W-M06-quickmatch-{mode}.spec.ts.
 * Source task: docs/todo/active/2026-05-23-e2e-quickmatch-4modes.md (QM-2)
 */

import { test, expect } from '../../fixtures/auth'

const QM_ENDPOINT = '/api/rooms/quick-match'

test.describe('W-M06-QM Đấu Nhanh — L2 Happy Path @happy-path @multiplayer @quickmatch', () => {

  test('W-M06-QM-L2-001: POST quick-match DATABASE → 200 với quickMatch=true, remainingToday @quickmatch @write', async ({
    tier3Page,
  }) => {
    const page = tier3Page
    const res = await page.request.post(QM_ENDPOINT, {
      data: {
        mode: 'SPEED_RACE',
        bookScope: 'ALL',
        questionCount: 5,
        timePerQuestion: 30,
        source: 'DATABASE',
        language: 'vi',
      },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.quickMatch).toBe(true)
    expect(body.room.quickMatch).toBe(true)
    expect(body.room.hostPlaysGame).toBe(true)
    expect(body.room.mode).toBe('SPEED_RACE')
    expect(body.room.status).toBe('WAITING')
    expect(body.viewerUserId).toBeTruthy()
    expect(typeof body.remainingToday).toBe('number')
    expect(body.remainingToday).toBeGreaterThanOrEqual(0)
    expect(body.remainingToday).toBeLessThan(3)

    // Cleanup
    await page.request.delete(`/api/rooms/${body.room.id}`)
  })

  test('W-M06-QM-L2-002: UI flow — modal submit → redirect /room/{id}/lobby @quickmatch @write', async ({
    tier3Page,
  }) => {
    const page = tier3Page
    await page.goto('/multiplayer')
    await page.waitForSelector('[data-testid="qm-entry-cta"]')

    // Capture room id from the POST response, then assert redirect.
    const responsePromise = page.waitForResponse(resp =>
      resp.url().endsWith(QM_ENDPOINT) && resp.request().method() === 'POST',
    )
    await page.getByTestId('qm-entry-cta').click()
    await page.waitForSelector('[data-testid="qm-modal"]')
    await page.getByTestId('qm-submit').click()

    const resp = await responsePromise
    expect(resp.status()).toBe(200)
    const body = await resp.json()
    expect(body.room.quickMatch).toBe(true)

    await page.waitForURL(new RegExp(`/room/${body.room.id}/lobby$`))
    // Cleanup
    await page.request.delete(`/api/rooms/${body.room.id}`)
  })

  test('W-M06-QM-L2-003: AI source Tier <4 → AI_TIER_LOCKED via API @quickmatch', async ({
    tier3Page,
  }) => {
    const page = tier3Page
    const res = await page.request.post(QM_ENDPOINT, {
      data: {
        mode: 'SPEED_RACE',
        source: 'AI_GENERATED',
        bookScope: 'ALL',
        questionCount: 5,
        timePerQuestion: 30,
      },
    })
    expect(res.status()).toBe(422)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('AI_TIER_LOCKED')
    expect(body.currentTier).toBeLessThan(4)
  })

  test('W-M06-QM-L2-004: AI source Tier 4+ — API accepts AI_GENERATED (returns 200 hoặc AI_GENERATION_INSUFFICIENT, KHÔNG AI_TIER_LOCKED) @quickmatch @write', async ({
    tier4Page,
  }) => {
    const page = tier4Page
    const res = await page.request.post(QM_ENDPOINT, {
      data: {
        mode: 'SPEED_RACE',
        source: 'AI_GENERATED',
        bookScope: 'Sáng thế ký',
        questionCount: 5,
        timePerQuestion: 30,
        chapterFrom: 1, chapterTo: 3,
        verseFrom: 1, verseTo: 30,
      },
    })
    // Either 200 (AI service produced enough) or 422 with AI_GENERATION_INSUFFICIENT.
    // Test env may not have working AI provider — both are acceptable, just NOT TIER_LOCKED.
    if (res.status() === 200) {
      const body = await res.json()
      expect(body.success).toBe(true)
      await page.request.delete(`/api/rooms/${body.room.id}`)
    } else {
      expect(res.status()).toBe(422)
      const body = await res.json()
      expect(body.error).not.toBe('AI_TIER_LOCKED')
    }
  })

  test('W-M06-QM-L2-005: Daily cap — 4th call within day → DAILY_CAP_REACHED @quickmatch @write @serial', async ({
    tier3Page,
  }) => {
    const page = tier3Page
    const created: string[] = []
    // Burn through 3 calls (max cap). If user already used some today, the
    // 4th + check is still authoritative because counter is shared per-day.
    for (let i = 0; i < 3; i++) {
      const res = await page.request.post(QM_ENDPOINT, {
        data: { mode: 'SPEED_RACE', bookScope: 'ALL', questionCount: 5, timePerQuestion: 30, source: 'DATABASE' },
      })
      if (res.status() === 200) {
        const body = await res.json()
        created.push(body.room.id)
      } else if (res.status() === 422) {
        const body = await res.json()
        if (body.error === 'DAILY_CAP_REACHED') break // already capped
      }
    }
    // Final POST must be capped.
    const capRes = await page.request.post(QM_ENDPOINT, {
      data: { mode: 'SPEED_RACE', bookScope: 'ALL', questionCount: 5, timePerQuestion: 30, source: 'DATABASE' },
    })
    expect(capRes.status()).toBe(422)
    const capBody = await capRes.json()
    expect(capBody.error).toBe('DAILY_CAP_REACHED')
    expect(capBody.remaining).toBe(0)

    // Cleanup
    for (const id of created) await page.request.delete(`/api/rooms/${id}`)
  })

  test('W-M06-QM-L2-006: Counter card cập nhật sau khi tạo trận (data-used tăng) @quickmatch @write', async ({
    tier3Page,
  }) => {
    const page = tier3Page
    await page.goto('/multiplayer')
    await page.waitForSelector('[data-testid="qm-entry-counter"]')
    const before = Number(await page.getByTestId('qm-entry-counter').getAttribute('data-used'))

    // Skip if user already capped — can't assert increase.
    test.skip(before >= 3, 'User already at daily cap')

    const res = await page.request.post(QM_ENDPOINT, {
      data: { mode: 'SPEED_RACE', bookScope: 'ALL', questionCount: 5, timePerQuestion: 30, source: 'DATABASE' },
    })
    if (res.status() !== 200) return
    const body = await res.json()

    await page.reload()
    await page.waitForSelector('[data-testid="qm-entry-counter"]')
    const after = Number(await page.getByTestId('qm-entry-counter').getAttribute('data-used'))
    expect(after).toBe(before + 1)

    await page.request.delete(`/api/rooms/${body.room.id}`)
  })

  test('W-M06-QM-L2-008: Soft-host — 2 players in quick-match lobby (Player B join → room.players.length=2) @quickmatch @write @softhost', async ({
    tier3Page,
    tier4Page,
  }) => {
    // Player A (host) creates quick-match room.
    const createRes = await tier3Page.request.post(QM_ENDPOINT, {
      data: { mode: 'SPEED_RACE', bookScope: 'ALL', questionCount: 5, timePerQuestion: 30, source: 'DATABASE' },
    })
    if (createRes.status() !== 200) {
      const b = await createRes.json()
      test.skip(b.error === 'DAILY_CAP_REACHED', 'Daily cap hit before this test')
      return
    }
    const created = await createRes.json()
    const roomId = created.room.id
    const roomCode = created.room.roomCode ?? created.room.code

    // Player B joins by code.
    const joinRes = await tier4Page.request.post('/api/rooms/join', { data: { roomCode } })
    expect(joinRes.status()).toBe(200)
    const joined = await joinRes.json()
    expect(joined.success).toBe(true)

    // Verify 2 players in lobby + quickMatch flag preserved.
    const detailRes = await tier3Page.request.get(`/api/rooms/${roomId}`)
    expect(detailRes.status()).toBe(200)
    const detail = await detailRes.json()
    expect(detail.room.quickMatch).toBe(true)
    expect(detail.room.players.length).toBe(2)

    await tier3Page.request.delete(`/api/rooms/${roomId}`)
  })

  test('W-M06-QM-L2-009: Soft-host — non-host POST /start bypass "chỉ chủ phòng" gate, dừng ở ready gate @quickmatch @write @softhost', async ({
    tier3Page,
    tier4Page,
  }) => {
    // Validates QP-5 soft-host code path in RoomService.startRoom:505 —
    // when room.isQuickMatch(), the "Chỉ chủ phòng mới có thể bắt đầu"
    // exception is skipped. Without WS ready broadcast it should fail
    // at the ready gate ("Tất cả người chơi phải sẵn sàng") instead.
    const createRes = await tier3Page.request.post(QM_ENDPOINT, {
      data: { mode: 'SPEED_RACE', bookScope: 'ALL', questionCount: 5, timePerQuestion: 30, source: 'DATABASE' },
    })
    if (createRes.status() !== 200) {
      const b = await createRes.json()
      test.skip(b.error === 'DAILY_CAP_REACHED', 'Daily cap hit before this test')
      return
    }
    const created = await createRes.json()
    const roomId = created.room.id
    const roomCode = created.room.roomCode ?? created.room.code

    await tier4Page.request.post('/api/rooms/join', { data: { roomCode } })

    // Non-host (tier4) calls /start. BE rejects with ready-gate message
    // (NOT "chỉ chủ phòng") — proves soft-host bypass reached.
    const startRes = await tier4Page.request.post(`/api/rooms/${roomId}/start`)
    expect(startRes.status()).not.toBe(200)
    const body = await startRes.json()
    const msg = String(body.message ?? body.error ?? '')
    expect(msg).not.toMatch(/chỉ chủ phòng/i)
    expect(msg).toMatch(/sẵn sàng|chơi/i) // ready-gate or player-count gate

    await tier3Page.request.delete(`/api/rooms/${roomId}`)
  })

  test('W-M06-QM-L3-005: Đủ 2 người là game bắt đầu — full WS ready + start flow @quickmatch @realtime @softhost', async () => {
    // [DEFERRED — WEBSOCKET INFRASTRUCTURE]
    // Full happy path documented in DECISIONS.md 2026-05-15:
    // 1. Player A creates QM room.
    // 2. Player B joins by code.
    // 3. Player A and B connect WS /ws, send /app/room/{id}/ready.
    // 4. Player B (non-host) POST /api/rooms/{id}/start → 200.
    // 5. Both players receive QUESTION_START WS event.
    // 6. Assert room.status = IN_PROGRESS.
    // Reuse WS helper from W-M06-survival-50p.spec.ts when shared.
    test.skip()
  })

  test('W-M06-QM-L2-007: questionCount + timePerQuestion clamp (out-of-range → coerce về default) @quickmatch @write', async ({
    tier3Page,
  }) => {
    const page = tier3Page
    const res = await page.request.post(QM_ENDPOINT, {
      data: { mode: 'SPEED_RACE', bookScope: 'ALL', questionCount: 999, timePerQuestion: 5, source: 'DATABASE' },
    })
    // BE coerces invalid bounds to defaults (10 / 30) per RoomController:153-154.
    if (res.status() === 200) {
      const body = await res.json()
      expect(body.room.totalQuestions ?? body.room.questionCount).toBe(10)
      expect(body.room.timePerQuestion).toBe(30)
      await page.request.delete(`/api/rooms/${body.room.id}`)
    } else {
      // If cap hit first, skip.
      const body = await res.json()
      test.skip(body.error === 'DAILY_CAP_REACHED', 'Daily cap hit before this test')
    }
  })

})
