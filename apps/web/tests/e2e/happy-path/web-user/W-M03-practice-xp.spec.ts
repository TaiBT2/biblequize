/**
 * W-M03 — Practice Mode XP Persistence (L2 Happy Path)
 *
 * Routes: POST /api/sessions, POST /api/sessions/{id}/answer,
 *         GET /api/me/tier-progress
 * Spec ref: user request 2026-04-20 "Practice tích XP đến cap Tier 2"
 *
 * Pins the multi-part fix that restored Practice XP persistence:
 *   1. fix(api): @JsonAlias("clientElapsedMs") on SubmitAnswerRequest
 *      — unblocks body parsing (was 400 UnrecognizedPropertyException)
 *   2. fix(api): findByEmail fallback in SessionService.submitAnswer
 *      — the JWT subject is email, not UUID
 *   3. fix(api): int return on UserQuestionHistoryRepository.deleteAllByUserId
 *      — @Modifying DML contract rejects long
 *   4. fix(api): docker profile in AdminTestController @Profile
 *      — so test fixtures load under docker-compose
 *   5. feat(api): creditNonRankedProgress ticks UDP for non-Ranked modes
 *
 * Invariants (post-fix):
 *   - Tier-1 (totalPoints < 1000): correct Practice answer → totalPoints↑
 *   - Tier-2+ (totalPoints ≥ 1000): correct Practice answer → questionsCounted↑
 *     but totalPoints unchanged (cap — Ranked is the driver past Tier 1)
 *
 * Test design: pure API flow. A Practice session built through the UI has
 * scoreboard timings + smart-selection + question rendering in the critical
 * path, which introduces flake without adding coverage over the question we
 * actually care about (did the XP land in UserDailyProgress?). The contract
 * — /api/sessions POST body, /answer body, /tier-progress read — is what
 * this spec pins.
 */

import { test, expect } from '../../fixtures/api'
import type { TestApi } from '../../helpers/test-api'

const TIER1_EMAIL = 'test1@dev.local'
const TIER2_EMAIL = 'test2@dev.local'
const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:8080'

// /api/me doesn't include totalPoints — only /api/me/tier-progress does.
async function fetchTotalPoints(testApi: TestApi, email: string): Promise<number> {
  const login = await testApi.loginAs(email, 'Test@123456')
  const res = await fetch(`${API_BASE}/api/me/tier-progress`, {
    headers: { Authorization: `Bearer ${login.accessToken}` },
  })
  if (!res.ok) throw new Error(`tier-progress ${email} failed: ${res.status}`)
  const body = (await res.json()) as { totalPoints: number }
  return body.totalPoints
}

// Create a Practice session + submit one answer. Returns the submitAnswer
// response so callers can read isCorrect / scoreDelta from the backend's
// source of truth (not the UI's derived display). Uses `clientElapsedMs`
// to exercise the JsonAlias path — that's the FE-native field name.
async function submitOnePracticeAnswer(
  accessToken: string,
  answerIndex: number,
): Promise<{
  status: number
  body: { isCorrect?: boolean; scoreDelta?: number; correctAnswer?: unknown[] }
}> {
  const createRes = await fetch(`${API_BASE}/api/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      mode: 'practice',
      questionCount: 3,
      book: 'Genesis',
      difficulty: 'easy',
      language: 'vi',
    }),
  })
  if (createRes.status !== 200) {
    throw new Error(`create session failed: ${createRes.status} ${await createRes.text()}`)
  }
  const session = (await createRes.json()) as {
    sessionId: string
    questions: Array<{ id: string; correctAnswer?: number[] }>
  }

  const firstQ = session.questions[0]
  const answerRes = await fetch(
    `${API_BASE}/api/sessions/${session.sessionId}/answer`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        sessionId: session.sessionId,
        questionId: firstQ.id,
        answer: answerIndex,
        clientElapsedMs: 5000,
      }),
    },
  )
  const body = (await answerRes.json()) as {
    isCorrect?: boolean
    scoreDelta?: number
    correctAnswer?: unknown[]
  }
  return { status: answerRes.status, body }
}

test.describe('W-M03 Practice Mode — XP Persistence', () => {
  // ── W-M03-L2-014 @write — Tier-1 correct answer grants XP ──────────────

  test('W-M03-L2-014: tier-1 correct Practice answer -> totalPoints increases by scoreDelta @write', async ({
    testApi,
  }) => {
    // ══ SECTION 1: SETUP ══════════════════════════════════════════════════
    await testApi.seedPoints(TIER1_EMAIL, 0)
    await testApi.resetHistory(TIER1_EMAIL)
    await testApi.setState(TIER1_EMAIL, { livesRemaining: 100, questionsCounted: 0 })

    const beforePoints = await fetchTotalPoints(testApi, TIER1_EMAIL)
    expect(beforePoints).toBe(0)

    const { accessToken } = await testApi.loginAs(TIER1_EMAIL, 'Test@123456')

    // ══ SECTION 2: ACTIONS ════════════════════════════════════════════════
    // Try each answer index until we hit the correct one — Practice session
    // creation picks a random question, so we can't precompute the index.
    let result: Awaited<ReturnType<typeof submitOnePracticeAnswer>> | undefined
    for (let i = 0; i < 4 && !result?.body.isCorrect; i++) {
      result = await submitOnePracticeAnswer(accessToken, i)
      expect(result.status).toBe(200) // alias fix pinned every iteration
    }
    expect(result?.body.isCorrect).toBe(true)

    // ══ SECTION 3: UI ASSERTIONS ══════════════════════════════════════════
    // No UI in this flow.

    // ══ SECTION 4: API VERIFICATION ═══════════════════════════════════════
    const afterPoints = await fetchTotalPoints(testApi, TIER1_EMAIL)
    expect(afterPoints).toBeGreaterThan(beforePoints)
    // scoreDelta from the backend is the canonical credit amount.
    expect(afterPoints).toBe(beforePoints + (result!.body.scoreDelta ?? 0))
  })

  // ── W-M03-L2-015 @write — Tier-2+ Practice is capped ───────────────────

  test('W-M03-L2-015: tier-2 correct Practice answer -> totalPoints capped (no change) @write', async ({
    testApi,
  }) => {
    // ══ SECTION 1: SETUP ══════════════════════════════════════════════════
    await testApi.seedPoints(TIER2_EMAIL, 1500)
    await testApi.resetHistory(TIER2_EMAIL)
    await testApi.setState(TIER2_EMAIL, { livesRemaining: 100, questionsCounted: 0 })

    const beforePoints = await fetchTotalPoints(testApi, TIER2_EMAIL)
    expect(beforePoints).toBeGreaterThanOrEqual(1000)

    const { accessToken } = await testApi.loginAs(TIER2_EMAIL, 'Test@123456')

    // ══ SECTION 2: ACTIONS ════════════════════════════════════════════════
    let result: Awaited<ReturnType<typeof submitOnePracticeAnswer>> | undefined
    for (let i = 0; i < 4 && !result?.body.isCorrect; i++) {
      result = await submitOnePracticeAnswer(accessToken, i)
      expect(result.status).toBe(200)
    }
    expect(result?.body.isCorrect).toBe(true)

    // ══ SECTION 3: UI ASSERTIONS ══════════════════════════════════════════
    // No UI in this flow.

    // ══ SECTION 4: API VERIFICATION ═══════════════════════════════════════
    const afterPoints = await fetchTotalPoints(testApi, TIER2_EMAIL)
    // Cap invariant: answered correctly, but totalPoints is unchanged.
    // questionsCounted still ticked (verified by backend log output when
    // running locally) — that's outside the /tier-progress surface.
    expect(afterPoints).toBe(beforePoints)
  })

  // ── W-M03-L2-016 @contract — Pin the clientElapsedMs wire contract ────

  test('W-M03-L2-016: POST /api/sessions/{id}/answer accepts clientElapsedMs @contract', async ({
    testApi,
  }) => {
    // ══ SECTION 1: SETUP ══════════════════════════════════════════════════
    const { accessToken } = await testApi.loginAs(TIER1_EMAIL, 'Test@123456')

    // ══ SECTION 2: ACTIONS ════════════════════════════════════════════════
    const { status, body } = await submitOnePracticeAnswer(accessToken, 0)

    // ══ SECTION 3: UI ASSERTIONS ══════════════════════════════════════════
    // No UI — contract test.

    // ══ SECTION 4: API VERIFICATION ═══════════════════════════════════════
    // Pre-fix: 400 "Field 'clientElapsedMs' is not allowed".
    // Post-fix: 200 regardless of answer correctness.
    expect(status).toBe(200)
    expect(body).toHaveProperty('isCorrect')
    expect(body).toHaveProperty('correctAnswer')
  })
})
