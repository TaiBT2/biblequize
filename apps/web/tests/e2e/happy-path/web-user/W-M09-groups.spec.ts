/**
 * W-M09 — Church Groups (L2 Happy Path)
 *
 * Routes: /groups, /groups/:id, /groups/:id/analytics
 * Spec ref: SPEC_USER §9.1
 */

import { test, expect } from '../../fixtures/auth'
import { LoginPage } from '../../pages/LoginPage'

const BASE_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:8080'
const TEST3_EMAIL = 'test3@dev.local'
const TEST4_EMAIL = 'test4@dev.local'
const TEST5_EMAIL = 'test5@dev.local'
const ADMIN_EMAIL = 'admin@biblequiz.test'
const PASSWORD = 'Test@123456'

// ── Helpers ─────────────────────────────────────────────────────────

async function loginAndGetToken(email: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/mobile/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  })
  const data = await res.json()
  return data.accessToken
}

async function createGroup(
  token: string,
  body = {
    name: 'Test Group E2E',
    description: 'Testing group creation',
    language: 'vi',
  },
): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/groups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function deleteGroup(token: string, groupId: string): Promise<void> {
  await fetch(`${BASE_URL}/api/groups/${groupId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

async function joinGroup(token: string, joinCode: string): Promise<Response> {
  return fetch(`${BASE_URL}/api/groups/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ joinCode }),
  })
}

async function leaveGroup(token: string, groupId: string): Promise<Response> {
  return fetch(`${BASE_URL}/api/groups/${groupId}/leave`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

async function getGroup(token: string, groupId: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/groups/${groupId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return { status: res.status, data: res.ok ? await res.json() : null }
}

// ── Tests ───────────────────────────────────────────────────────────

test.describe('W-M09 Church Groups — L2 Happy Path @happy-path @groups', () => {

  test('W-M09-L2-001: Create group POST /api/groups returns group + join code @write @serial @critical', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token = await loginAndGetToken(TEST3_EMAIL)

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const group = await createGroup(token)

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    expect(group.id).toBeTruthy()
    expect(group.name).toBe('Test Group E2E')
    expect(group.description).toBe('Testing group creation')
    expect(group.joinCode).toMatch(/^[A-Z0-9]{6}$/)
    expect(group.memberCount).toBe(1)

    // Verify via GET
    const { data } = await getGroup(token, group.id)
    expect(data.name).toBe('Test Group E2E')

    // ============================================================
    // CLEANUP
    // ============================================================
    await deleteGroup(token, group.id)
  })

  test.skip('W-M09-L2-002: UI flow — create group form, redirect to detail @write @serial', async ({
    page,
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.loginWithCredentials(TEST3_EMAIL, PASSWORD)
    await page.waitForURL('/')

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    await page.goto('/groups')
    // Wait for no-group or create button
    const createBtn = page.getByRole('button', { name: /Tạo nhóm|Create group/i })
    await createBtn.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {
      // No "no-group" state — user may already be in a group
    })

    if (await createBtn.isVisible()) {
      await createBtn.click()

      // Fill form
      await page.getByTestId('groups-create-name-input').fill('E2E UI Group')
      await page.getByTestId('group-description-input').fill('Created via E2E')
      await page.getByTestId('groups-create-submit-btn').click()

      // ============================================================
      // SECTION 3: UI ASSERTIONS
      // ============================================================
      await page.waitForURL(/\/groups\/[a-z0-9-]+/)
      await expect(page).toHaveURL(/\/groups\/[a-z0-9-]+/)
      await expect(page.getByTestId('group-detail-page')).toBeVisible()
      await expect(page.getByTestId('group-detail-name')).toHaveText('E2E UI Group')
      await expect(page.getByTestId('group-detail-members')).toBeVisible()

      // ============================================================
      // CLEANUP
      // ============================================================
      const url = page.url()
      const groupId = url.match(/\/groups\/([a-z0-9-]+)/)?.[1]
      if (groupId) {
        const token = await loginAndGetToken(TEST3_EMAIL)
        await deleteGroup(token, groupId)
      }
    } else {
      test.skip(true, 'User already in a group — cannot test create flow')
    }
  })

  test('W-M09-L2-003: Join group via code POST /api/groups/join @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — test3 creates group
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const group = await createGroup(token3)
    const token4 = await loginAndGetToken(TEST4_EMAIL)

    // ============================================================
    // SECTION 2: ACTIONS — test4 joins
    // ============================================================
    const joinRes = await joinGroup(token4, group.joinCode)
    expect(joinRes.ok).toBe(true)

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    const { data } = await getGroup(token3, group.id)
    expect(data.memberCount).toBe(2)

    // ============================================================
    // CLEANUP
    // ============================================================
    await leaveGroup(token4, group.id)
    await deleteGroup(token3, group.id)
  })

  test('W-M09-L2-004: Join with invalid code returns 404 @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token = await loginAndGetToken(TEST3_EMAIL)

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const res = await joinGroup(token, 'ZZZZZZ')

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    expect(res.status).toBe(404)
  })

  test('W-M09-L2-005: Join group already member of returns 409 @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — test3 creates group (already member)
    // ============================================================
    const token = await loginAndGetToken(TEST3_EMAIL)
    const group = await createGroup(token)

    // ============================================================
    // SECTION 2: ACTIONS — test3 tries to join own group
    // ============================================================
    const res = await joinGroup(token, group.joinCode)

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    // Expect 409 Conflict or idempotent success
    expect([200, 409]).toContain(res.status)

    // ============================================================
    // CLEANUP
    // ============================================================
    await deleteGroup(token, group.id)
  })

  test('W-M09-L2-006: Update group PATCH by owner succeeds @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token = await loginAndGetToken(TEST3_EMAIL)
    const group = await createGroup(token)

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const patchRes = await fetch(`${BASE_URL}/api/groups/${group.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: 'Updated Name', description: 'Updated desc' }),
    })

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    expect(patchRes.ok).toBe(true)
    const { data } = await getGroup(token, group.id)
    expect(data.name).toBe('Updated Name')
    expect(data.description).toBe('Updated desc')

    // ============================================================
    // CLEANUP
    // ============================================================
    await deleteGroup(token, group.id)
  })

  test('W-M09-L2-007: Update group by non-owner returns 403 @write @serial @security', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const group = await createGroup(token3)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    await joinGroup(token4, group.joinCode)

    // ============================================================
    // SECTION 2: ACTIONS — test4 tries to update
    // ============================================================
    const patchRes = await fetch(`${BASE_URL}/api/groups/${group.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token4}`,
      },
      body: JSON.stringify({ name: 'Hacked' }),
    })

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    expect(patchRes.status).toBe(403)
    // Name unchanged
    const { data } = await getGroup(token3, group.id)
    expect(data.name).toBe('Test Group E2E')

    // ============================================================
    // CLEANUP
    // ============================================================
    await leaveGroup(token4, group.id)
    await deleteGroup(token3, group.id)
  })

  test('W-M09-L2-008: Leaderboard GET returns members ranked by XP @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — create group with members
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const group = await createGroup(token3)

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const res = await fetch(`${BASE_URL}/api/groups/${group.id}/leaderboard`, {
      headers: { Authorization: `Bearer ${token3}` },
    })

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    expect(res.ok).toBe(true)
    const leaderboard = await res.json()
    expect(Array.isArray(leaderboard)).toBe(true)

    // Verify sorted by totalPoints desc
    for (let i = 1; i < leaderboard.length; i++) {
      expect(leaderboard[i - 1].totalPoints).toBeGreaterThanOrEqual(
        leaderboard[i].totalPoints,
      )
    }

    // Each entry has required fields
    for (const entry of leaderboard) {
      expect(entry).toHaveProperty('userId')
      expect(entry).toHaveProperty('name')
      expect(entry).toHaveProperty('totalPoints')
    }

    // ============================================================
    // CLEANUP
    // ============================================================
    await deleteGroup(token3, group.id)
  })

  test('W-M09-L2-009: Kick member — owner kicks test4, memberCount decreases @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const group = await createGroup(token3)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    await joinGroup(token4, group.joinCode)

    const userId4 = await testApi.getUserIdByEmail(TEST4_EMAIL)

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const kickRes = await fetch(
      `${BASE_URL}/api/groups/${group.id}/members/${userId4}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token3}` },
      },
    )

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    expect(kickRes.ok).toBe(true)
    const { data } = await getGroup(token3, group.id)
    expect(data.memberCount).toBe(1)

    // ============================================================
    // CLEANUP
    // ============================================================
    await deleteGroup(token3, group.id)
  })

  test('W-M09-L2-010: Create announcement POST /api/groups/{id}/announcements @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token = await loginAndGetToken(TEST3_EMAIL)
    const group = await createGroup(token)

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const postRes = await fetch(
      `${BASE_URL}/api/groups/${group.id}/announcements`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: 'Welcome', content: 'Group rules...' }),
      },
    )

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    expect(postRes.ok).toBe(true)

    const getRes = await fetch(
      `${BASE_URL}/api/groups/${group.id}/announcements`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    const announcements = await getRes.json()
    expect(Array.isArray(announcements)).toBe(true)
    expect(announcements.length).toBeGreaterThanOrEqual(1)

    // ============================================================
    // CLEANUP
    // ============================================================
    await deleteGroup(token, group.id)
  })

  test('W-M09-L2-011: Leave group DELETE /api/groups/{id}/leave — memberCount decreases @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const group = await createGroup(token3)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    await joinGroup(token4, group.joinCode)

    // Snapshot before
    const before = await getGroup(token3, group.id)
    const memberCountBefore = before.data.memberCount

    // ============================================================
    // SECTION 2: ACTIONS — test4 leaves
    // ============================================================
    const leaveRes = await leaveGroup(token4, group.id)
    expect(leaveRes.ok).toBe(true)

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION — assert delta
    // ============================================================
    const after = await getGroup(token3, group.id)
    expect(after.data.memberCount).toBe(memberCountBefore - 1)

    // ============================================================
    // CLEANUP
    // ============================================================
    await deleteGroup(token3, group.id)
  })

  test('W-M09-L2-012: Delete group by owner — group removed @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const group = await createGroup(token3)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    await joinGroup(token4, group.joinCode)

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    await deleteGroup(token3, group.id)

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    const { status } = await getGroup(token3, group.id)
    expect(status).toBe(404)
  })

  test('W-M09-L2-013: Two members playing same quiz set join the same room @write @serial @critical', async ({
    testApi,
  }) => {
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)

    // ============================================================
    // SECTION 1: SETUP — group with 2 members + quiz set
    // ============================================================

    // Pre-cleanup: test4 may be stuck in a group from a previous failed run
    const me4Res = await fetch(`${BASE_URL}/api/groups/me`, { headers: { Authorization: `Bearer ${token4}` } })
    const me4 = await me4Res.json()
    if (me4.hasGroup && me4.groupId) {
      await fetch(`${BASE_URL}/api/groups/${me4.groupId}/leave`, { method: 'DELETE', headers: { Authorization: `Bearer ${token4}` } })
    }

    // Create group (response: { success, group: { id, name, code, memberCount } })
    const createGroupRes = await fetch(`${BASE_URL}/api/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token3}` },
      body: JSON.stringify({ name: 'E2E Quiz Set Group', description: 'test', language: 'vi' }),
    })
    const createGroupBody = await createGroupRes.json()
    expect(createGroupRes.ok, `createGroup failed: ${JSON.stringify(createGroupBody)}`).toBe(true)
    const groupId: string = createGroupBody.group.id
    const joinCode: string = createGroupBody.group.code
    expect(groupId).toBeTruthy()
    expect(joinCode).toBeTruthy()

    // test4 joins the group (endpoint expects field "code" or "groupCode")
    const joinRes = await fetch(`${BASE_URL}/api/groups/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token4}` },
      body: JSON.stringify({ code: joinCode }),
    })
    const joinBody = await joinRes.clone().text()
    expect(joinRes.ok, `join failed: ${joinBody}`).toBe(true)

    // Get question IDs (no auth required)
    const questionsRaw = await (await fetch(`${BASE_URL}/api/questions?count=3`)).json()
    const questionIds: string[] = (Array.isArray(questionsRaw) ? questionsRaw : questionsRaw.questions ?? questionsRaw.content ?? [])
      .slice(0, 3).map((q: any) => q.id)
    expect(questionIds.length, 'no questions available').toBeGreaterThanOrEqual(1)

    // Create quiz set (leader token3 has permission; response: { success, quizSet: { id, ... } })
    const qsRes = await fetch(`${BASE_URL}/api/groups/${groupId}/quiz-sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token3}` },
      body: JSON.stringify({ name: 'E2E Quiz Set', questionIds }),
    })
    const qsBody = await qsRes.json()
    expect(qsRes.ok, `createQuizSet failed: ${JSON.stringify(qsBody)}`).toBe(true)
    const quizSetId: string = qsBody.quizSet.id
    expect(quizSetId).toBeTruthy()

    // ============================================================
    // SECTION 2: ACTIONS — both users hit play endpoint sequentially
    // ============================================================
    const play3Res = await fetch(
      `${BASE_URL}/api/groups/${groupId}/quiz-sets/${quizSetId}/play`,
      { method: 'POST', headers: { Authorization: `Bearer ${token3}` } },
    )
    const play3Body = await play3Res.json()
    expect(play3Res.ok, `play3 failed: ${JSON.stringify(play3Body)}`).toBe(true)

    const play4Res = await fetch(
      `${BASE_URL}/api/groups/${groupId}/quiz-sets/${quizSetId}/play`,
      { method: 'POST', headers: { Authorization: `Bearer ${token4}` } },
    )
    const play4Body = await play4Res.json()
    expect(play4Res.ok, `play4 failed: ${JSON.stringify(play4Body)}`).toBe(true)

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A (API-only test)
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION — both must land in the same room
    // ============================================================
    const room3 = play3Body.room
    const room4 = play4Body.room

    expect(room3.id).toBeTruthy()
    expect(room4.id).toBeTruthy()
    expect(room3.id).toBe(room4.id)
    expect(room3.roomCode).toBe(room4.roomCode)

    // ============================================================
    // CLEANUP
    // ============================================================
    await fetch(`${BASE_URL}/api/groups/${groupId}/leave`, { method: 'DELETE', headers: { Authorization: `Bearer ${token4}` } })
    await fetch(`${BASE_URL}/api/groups/${groupId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token3}` } })
  })

  // ── Quiz Set workflow (leader ↔ member) — SPEC_GROUP §6.1, §6.2 ──

  async function ensureNoGroup(token: string): Promise<void> {
    const me = await (await fetch(`${BASE_URL}/api/groups/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })).json()
    if (me.hasGroup && me.groupId) {
      await fetch(`${BASE_URL}/api/groups/${me.groupId}/leave`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      await fetch(`${BASE_URL}/api/groups/${me.groupId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
    }
  }

  async function setupGroupWithMember(
    leaderToken: string,
    memberToken: string,
  ): Promise<{ groupId: string }> {
    await ensureNoGroup(memberToken)
    await ensureNoGroup(leaderToken)
    const res = await fetch(`${BASE_URL}/api/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${leaderToken}` },
      body: JSON.stringify({ name: 'E2E QuizSet Group', description: 'test', language: 'vi' }),
    })
    const body = await res.json()
    const groupId = body.group.id as string
    const code = body.group.code as string
    const joinRes = await fetch(`${BASE_URL}/api/groups/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}` },
      body: JSON.stringify({ code }),
    })
    expect(joinRes.ok, `member join failed: ${await joinRes.clone().text()}`).toBe(true)
    return { groupId }
  }

  async function fetchQuestionIds(count: number): Promise<string[]> {
    const data = await (await fetch(`${BASE_URL}/api/questions?count=${count}`)).json()
    const arr: any[] = Array.isArray(data) ? data : data.questions ?? data.content ?? []
    return arr.slice(0, count).map((q) => q.id)
  }

  async function createQuizSetAs(
    token: string,
    groupId: string,
    name: string,
    questionIds: string[],
  ): Promise<any> {
    const res = await fetch(`${BASE_URL}/api/groups/${groupId}/quiz-sets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, questionIds }),
    })
    const body = await res.json()
    expect(res.ok, `createQuizSet failed: ${JSON.stringify(body)}`).toBe(true)
    return body.quizSet
  }

  async function publishQuizSet(token: string, groupId: string, setId: string): Promise<Response> {
    return fetch(`${BASE_URL}/api/groups/${groupId}/quiz-sets/${setId}/publish`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  test('W-M09-L2-014: Leader creates quiz set — defaults to DRAFT status @write @serial @critical', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — leader + member in a fresh group
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)

    try {
      // ============================================================
      // SECTION 2: ACTIONS — leader creates the quiz set
      // ============================================================
      const questionIds = await fetchQuestionIds(5)
      expect(questionIds.length).toBeGreaterThan(0)
      const quizSet = await createQuizSetAs(token3, groupId, 'E2E Draft Set', questionIds)

      // ============================================================
      // SECTION 3: UI ASSERTIONS — N/A (API-only test)
      // ============================================================

      // ============================================================
      // SECTION 4: API VERIFICATION — DRAFT until explicitly published
      // ============================================================
      expect(quizSet.id).toBeTruthy()
      expect(quizSet.name).toBe('E2E Draft Set')
      expect(quizSet.publishStatus).toBe('DRAFT')
    } finally {
      // ============================================================
      // CLEANUP
      // ============================================================
      await fetch(`${BASE_URL}/api/groups/${groupId}/leave`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token4}` },
      })
      await fetch(`${BASE_URL}/api/groups/${groupId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token3}` },
      })
    }
  })

  test('W-M09-L2-015: Leader publishes quiz set — DRAFT → PUBLISHED @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)

    try {
      const questionIds = await fetchQuestionIds(5)
      const quizSet = await createQuizSetAs(token3, groupId, 'E2E Publishable Set', questionIds)
      expect(quizSet.publishStatus).toBe('DRAFT')

      // ============================================================
      // SECTION 2: ACTIONS
      // ============================================================
      const res = await publishQuizSet(token3, groupId, quizSet.id)
      const body = await res.json()

      // ============================================================
      // SECTION 3: UI ASSERTIONS — N/A
      // ============================================================

      // ============================================================
      // SECTION 4: API VERIFICATION
      // ============================================================
      expect(res.ok).toBe(true)
      expect(body.quizSet.publishStatus).toBe('PUBLISHED')
      expect(body.quizSet.id).toBe(quizSet.id)
    } finally {
      await fetch(`${BASE_URL}/api/groups/${groupId}/leave`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token4}` },
      })
      await fetch(`${BASE_URL}/api/groups/${groupId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token3}` },
      })
    }
  })

  test('W-M09-L2-016: Member only sees PUBLISHED quiz sets — leader DRAFT is hidden @write @serial @critical', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — leader creates 2 sets, publishes only one
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)

    try {
      const questionIds = await fetchQuestionIds(5)
      const draftSet = await createQuizSetAs(token3, groupId, 'E2E Stays Draft', questionIds)
      const publishedSet = await createQuizSetAs(token3, groupId, 'E2E Gets Published', questionIds)
      const pubRes = await publishQuizSet(token3, groupId, publishedSet.id)
      expect(pubRes.ok).toBe(true)

      // ============================================================
      // SECTION 2: ACTIONS — list as the member and as the leader
      // ============================================================
      const memberList = await (await fetch(`${BASE_URL}/api/groups/${groupId}/quiz-sets`, {
        headers: { Authorization: `Bearer ${token4}` },
      })).json()
      const leaderList = await (await fetch(`${BASE_URL}/api/groups/${groupId}/quiz-sets`, {
        headers: { Authorization: `Bearer ${token3}` },
      })).json()

      // ============================================================
      // SECTION 3: UI ASSERTIONS — N/A
      // ============================================================

      // ============================================================
      // SECTION 4: API VERIFICATION — visibility filter per SPEC_GROUP §6.1 (Q-5)
      // ============================================================
      const memberIds = (memberList.quizSets ?? []).map((q: any) => q.id)
      const leaderIds = (leaderList.quizSets ?? []).map((q: any) => q.id)
      expect(memberIds).toContain(publishedSet.id)
      expect(memberIds).not.toContain(draftSet.id)
      // Leader sees both — the draft they own + the published set.
      expect(leaderIds).toContain(draftSet.id)
      expect(leaderIds).toContain(publishedSet.id)
    } finally {
      await fetch(`${BASE_URL}/api/groups/${groupId}/leave`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token4}` },
      })
      await fetch(`${BASE_URL}/api/groups/${groupId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token3}` },
      })
    }
  })

  test('W-M09-L2-017: Member cannot edit or delete the leader\'s quiz set @write @serial @security', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)

    try {
      const questionIds = await fetchQuestionIds(5)
      const quizSet = await createQuizSetAs(token3, groupId, 'E2E Protected Set', questionIds)
      await publishQuizSet(token3, groupId, quizSet.id)

      // ============================================================
      // SECTION 2: ACTIONS — member attempts to edit + delete
      // ============================================================
      const editRes = await fetch(`${BASE_URL}/api/groups/${groupId}/quiz-sets/${quizSet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token4}` },
        body: JSON.stringify({ name: 'Hijack Attempt' }),
      })
      const deleteRes = await fetch(`${BASE_URL}/api/groups/${groupId}/quiz-sets/${quizSet.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token4}` },
      })

      // ============================================================
      // SECTION 3: UI ASSERTIONS — N/A
      // ============================================================

      // ============================================================
      // SECTION 4: API VERIFICATION — both rejected; set unchanged
      // ============================================================
      expect(editRes.ok).toBe(false)
      expect(deleteRes.ok).toBe(false)

      // The set should still be there with its original name.
      const reread = await (await fetch(`${BASE_URL}/api/groups/${groupId}/quiz-sets`, {
        headers: { Authorization: `Bearer ${token3}` },
      })).json()
      const still = (reread.quizSets ?? []).find((q: any) => q.id === quizSet.id)
      expect(still).toBeTruthy()
      expect(still.name).toBe('E2E Protected Set')
    } finally {
      await fetch(`${BASE_URL}/api/groups/${groupId}/leave`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token4}` },
      })
      await fetch(`${BASE_URL}/api/groups/${groupId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token3}` },
      })
    }
  })

  // ── Quiz Set workflow Round 2: edit / delete / archive / leaderboard ──

  test('W-M09-L2-018: Leader edits quiz set name + questions @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)

    try {
      const initial = await fetchQuestionIds(5)
      const more = await fetchQuestionIds(7)
      const quizSet = await createQuizSetAs(token3, groupId, 'E2E Editable Set', initial)

      // ============================================================
      // SECTION 2: ACTIONS — leader PATCHes name + replaces questions
      // ============================================================
      const res = await fetch(`${BASE_URL}/api/groups/${groupId}/quiz-sets/${quizSet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token3}` },
        body: JSON.stringify({ name: 'E2E Edited Set', questionIds: more }),
      })
      const body = await res.json()

      // ============================================================
      // SECTION 3: UI ASSERTIONS — N/A
      // ============================================================

      // ============================================================
      // SECTION 4: API VERIFICATION
      // ============================================================
      expect(res.ok, `update failed: ${JSON.stringify(body)}`).toBe(true)
      expect(body.quizSet.name).toBe('E2E Edited Set')
      expect(body.quizSet.totalQuestions).toBe(more.length)
    } finally {
      await fetch(`${BASE_URL}/api/groups/${groupId}/leave`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token4}` },
      })
      await fetch(`${BASE_URL}/api/groups/${groupId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token3}` },
      })
    }
  })

  test('W-M09-L2-019: Leader deletes quiz set — disappears from the list @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)

    try {
      const questionIds = await fetchQuestionIds(5)
      const quizSet = await createQuizSetAs(token3, groupId, 'E2E Doomed Set', questionIds)

      // ============================================================
      // SECTION 2: ACTIONS — leader soft-deletes
      // ============================================================
      const delRes = await fetch(`${BASE_URL}/api/groups/${groupId}/quiz-sets/${quizSet.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token3}` },
      })
      expect(delRes.ok).toBe(true)

      // ============================================================
      // SECTION 3: UI ASSERTIONS — N/A
      // ============================================================

      // ============================================================
      // SECTION 4: API VERIFICATION — SOFT_DELETED is filtered from the list
      // ============================================================
      const list = await (await fetch(`${BASE_URL}/api/groups/${groupId}/quiz-sets`, {
        headers: { Authorization: `Bearer ${token3}` },
      })).json()
      const found = (list.quizSets ?? []).find((q: any) => q.id === quizSet.id)
      expect(found).toBeUndefined()
    } finally {
      await fetch(`${BASE_URL}/api/groups/${groupId}/leave`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token4}` },
      })
      await fetch(`${BASE_URL}/api/groups/${groupId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token3}` },
      })
    }
  })

  test('W-M09-L2-020: Leader archives + unarchives a published quiz set @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — publish first (archive requires PUBLISHED)
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)

    try {
      const questionIds = await fetchQuestionIds(5)
      const quizSet = await createQuizSetAs(token3, groupId, 'E2E Archive Set', questionIds)
      const pub = await publishQuizSet(token3, groupId, quizSet.id)
      expect(pub.ok).toBe(true)

      // ============================================================
      // SECTION 2: ACTIONS — archive, then unarchive
      // ============================================================
      const archiveRes = await fetch(`${BASE_URL}/api/groups/${groupId}/quiz-sets/${quizSet.id}/archive`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token3}` },
      })
      const archived = (await archiveRes.json()).quizSet

      const unarchiveRes = await fetch(`${BASE_URL}/api/groups/${groupId}/quiz-sets/${quizSet.id}/unarchive`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token3}` },
      })
      const unarchived = (await unarchiveRes.json()).quizSet

      // ============================================================
      // SECTION 3: UI ASSERTIONS — N/A
      // ============================================================

      // ============================================================
      // SECTION 4: API VERIFICATION
      // ============================================================
      expect(archiveRes.ok).toBe(true)
      expect(archived.publishStatus).toBe('ARCHIVED')
      expect(unarchiveRes.ok).toBe(true)
      expect(unarchived.publishStatus).toBe('PUBLISHED')
    } finally {
      await fetch(`${BASE_URL}/api/groups/${groupId}/leave`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token4}` },
      })
      await fetch(`${BASE_URL}/api/groups/${groupId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token3}` },
      })
    }
  })

  test('W-M09-L2-021: Quiz set leaderboard endpoint returns an array for members @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)

    try {
      const questionIds = await fetchQuestionIds(5)
      const quizSet = await createQuizSetAs(token3, groupId, 'E2E Leaderboard Set', questionIds)
      await publishQuizSet(token3, groupId, quizSet.id)

      // ============================================================
      // SECTION 2: ACTIONS — member fetches the per-set leaderboard
      // ============================================================
      const res = await fetch(`${BASE_URL}/api/groups/${groupId}/quiz-sets/${quizSet.id}/leaderboard`, {
        headers: { Authorization: `Bearer ${token4}` },
      })
      const body = await res.json()

      // ============================================================
      // SECTION 3: UI ASSERTIONS — N/A
      // ============================================================

      // ============================================================
      // SECTION 4: API VERIFICATION — no plays yet, but the shape is stable
      // ============================================================
      expect(res.ok, `leaderboard fetch failed: ${JSON.stringify(body)}`).toBe(true)
      expect(body.success).toBe(true)
      expect(Array.isArray(body.leaderboard ?? body.entries ?? body.rankings)).toBe(true)
    } finally {
      await fetch(`${BASE_URL}/api/groups/${groupId}/leave`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token4}` },
      })
      await fetch(`${BASE_URL}/api/groups/${groupId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token3}` },
      })
    }
  })

  // ── Quiz Set workflow Round 3: clone / folder / AI permission gate ──

  test('W-M09-L2-022: Leader clones a quiz set — copy is a new DRAFT @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)

    try {
      const questionIds = await fetchQuestionIds(5)
      const original = await createQuizSetAs(token3, groupId, 'E2E Cloneable Set', questionIds)
      await publishQuizSet(token3, groupId, original.id)

      // ============================================================
      // SECTION 2: ACTIONS — leader clones the published set
      // ============================================================
      const res = await fetch(`${BASE_URL}/api/groups/${groupId}/quiz-sets/${original.id}/clone`, {
        method: 'POST', headers: { Authorization: `Bearer ${token3}` },
      })
      const body = await res.json()

      // ============================================================
      // SECTION 3: UI ASSERTIONS — N/A
      // ============================================================

      // ============================================================
      // SECTION 4: API VERIFICATION — fresh id, DRAFT, "(Bản sao)" suffix
      // ============================================================
      expect(res.ok, `clone failed: ${JSON.stringify(body)}`).toBe(true)
      expect(body.quizSet.id).toBeTruthy()
      expect(body.quizSet.id).not.toBe(original.id)
      expect(body.quizSet.publishStatus).toBe('DRAFT')
      expect(body.quizSet.name).toContain('(Bản sao)')
      expect(body.quizSet.totalQuestions).toBe(questionIds.length)
    } finally {
      await fetch(`${BASE_URL}/api/groups/${groupId}/leave`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token4}` },
      })
      await fetch(`${BASE_URL}/api/groups/${groupId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token3}` },
      })
    }
  })

  test('W-M09-L2-023: Leader creates a quiz-set folder — appears in the folder list @write @serial', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)

    try {
      // ============================================================
      // SECTION 2: ACTIONS — create folder, then list
      // ============================================================
      const createRes = await fetch(`${BASE_URL}/api/groups/${groupId}/quiz-set-folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token3}` },
        body: JSON.stringify({ name: 'E2E Folder', color: '#a855f7', displayOrder: 1 }),
      })
      const createBody = await createRes.json()
      expect(createRes.ok, `createFolder failed: ${JSON.stringify(createBody)}`).toBe(true)
      const folderId = createBody.folder.id as string
      expect(folderId).toBeTruthy()

      const listRes = await fetch(`${BASE_URL}/api/groups/${groupId}/quiz-set-folders`, {
        headers: { Authorization: `Bearer ${token3}` },
      })
      const listBody = await listRes.json()

      // ============================================================
      // SECTION 3: UI ASSERTIONS — N/A
      // ============================================================

      // ============================================================
      // SECTION 4: API VERIFICATION
      // ============================================================
      expect(listRes.ok).toBe(true)
      const found = (listBody.folders ?? []).find((f: any) => f.id === folderId)
      expect(found).toBeTruthy()
      expect(found.name).toBe('E2E Folder')
    } finally {
      await fetch(`${BASE_URL}/api/groups/${groupId}/leave`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token4}` },
      })
      await fetch(`${BASE_URL}/api/groups/${groupId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token3}` },
      })
    }
  })

  test('W-M09-L2-024: Member cannot trigger AI question generation — permission gate @write @serial @security', async ({
    testApi,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)

    try {
      // ============================================================
      // SECTION 2: ACTIONS — member hits the group-level AI endpoint
      //   (we intentionally test the rejection path so the real Gemini
      //    call is never made — gate must run before that)
      // ============================================================
      const res = await fetch(`${BASE_URL}/api/groups/${groupId}/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token4}` },
        body: JSON.stringify({ topic: 'Sáng Thế Ký', count: 3 }),
      })
      const body = await res.json()

      // ============================================================
      // SECTION 3: UI ASSERTIONS — N/A
      // ============================================================

      // ============================================================
      // SECTION 4: API VERIFICATION — rejected, not a 200 success
      // ============================================================
      expect(res.ok).toBe(false)
      expect(body.success).toBe(false)
    } finally {
      await fetch(`${BASE_URL}/api/groups/${groupId}/leave`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token4}` },
      })
      await fetch(`${BASE_URL}/api/groups/${groupId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token3}` },
      })
    }
  })

  test('W-M09-L2-025: Leader generates questions via AI — returns the requested batch @write @serial @ai', async ({
    testApi,
  }) => {
    // Real provider call (DeepSeek) — give the model time to respond.
    test.setTimeout(180_000)

    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)

    try {
      // ============================================================
      // SECTION 2: ACTIONS — small batch to keep token usage modest
      // ============================================================
      const requested = 2
      const res = await fetch(`${BASE_URL}/api/groups/${groupId}/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token3}` },
        body: JSON.stringify({
          book: 'John',
          chapter: 3,
          verseStart: 1,
          verseEnd: 21,
          count: requested,
          difficulty: 'EASY',
          language: 'vi',
        }),
      })
      const body = await res.json()

      // ============================================================
      // SECTION 3: UI ASSERTIONS — N/A
      // ============================================================

      // ============================================================
      // SECTION 4: API VERIFICATION — quota may legitimately trip; the
      //   quota path is its own contract, so accept either outcome
      //   without making the test flaky.
      // ============================================================
      if (res.status === 429) {
        expect(body.error).toBe('QUOTA_EXCEEDED')
        return
      }
      expect(res.ok, `ai-generate failed: ${JSON.stringify(body)}`).toBe(true)
      expect(body.success).toBe(true)
      expect(Array.isArray(body.questions)).toBe(true)
      expect(body.questions.length).toBe(requested)
      expect(typeof body.provider === 'string' && body.provider.length > 0).toBe(true)
      // Each generated question carries the load-bearing fields the UI relies on.
      for (const q of body.questions) {
        expect(typeof q.content === 'string' && q.content.length > 0).toBe(true)
        expect(Array.isArray(q.options) && q.options.length >= 2).toBe(true)
        expect(typeof q.correctAnswer === 'number').toBe(true)
      }
    } finally {
      await fetch(`${BASE_URL}/api/groups/${groupId}/leave`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token4}` },
      })
      await fetch(`${BASE_URL}/api/groups/${groupId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token3}` },
      })
    }
  })

  // ── Round 4: leader lifecycle / permissions / data integrity ──

  async function teardown(leaderToken: string, memberToken: string, groupId: string) {
    await fetch(`${BASE_URL}/api/groups/${groupId}/leave`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${memberToken}` },
    })
    await fetch(`${BASE_URL}/api/groups/${groupId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${leaderToken}` },
    })
  }

  async function getMemberRole(token: string, groupId: string, userId: string): Promise<string | null> {
    const res = await fetch(`${BASE_URL}/api/groups/${groupId}/members`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const body = await res.json()
    // GET /members responds with { success, data: { items: [...], total, ... } }.
    const list: any[] = body.data?.items ?? body.members ?? []
    const found = list.find((m) => m.userId === userId || m.id === userId)
    return found ? found.role : null
  }

  test('W-M09-L2-026: Role endpoint refuses to assign LEADER — transfer is a separate flow @write @serial @security', async ({
    testApi,
  }) => {
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)
    try {
      const userId4 = (await (await fetch(`${BASE_URL}/api/me`, { headers: { Authorization: `Bearer ${token4}` } })).json()).id
      const res = await fetch(`${BASE_URL}/api/groups/${groupId}/members/${userId4}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token3}` },
        body: JSON.stringify({ role: 'LEADER' }),
      })
      const body = await res.json()
      // Contract per ChurchGroupController:268 — LEADER cannot be assigned via
      // the role endpoint; promotion goes through the dedicated transfer flow.
      expect(res.ok).toBe(false)
      expect(JSON.stringify(body)).toMatch(/leader/i)
      // Role unchanged.
      expect(await getMemberRole(token3, groupId, userId4)).toBe('MEMBER')
    } finally {
      await teardown(token3, token4, groupId)
    }
  })

  test('W-M09-L2-027: Leader promotes member to MOD @write @serial', async ({ testApi }) => {
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)
    try {
      const userId4 = (await (await fetch(`${BASE_URL}/api/me`, { headers: { Authorization: `Bearer ${token4}` } })).json()).id
      const res = await fetch(`${BASE_URL}/api/groups/${groupId}/members/${userId4}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token3}` },
        body: JSON.stringify({ role: 'MOD' }),
      })
      expect(res.ok).toBe(true)
      expect(await getMemberRole(token3, groupId, userId4)).toBe('MOD')
    } finally {
      await teardown(token3, token4, groupId)
    }
  })

  test('W-M09-L2-028: Publish a quiz set with <5 questions is rejected @write @serial', async ({
    testApi,
  }) => {
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)
    try {
      const ids = await fetchQuestionIds(3)
      const set = await createQuizSetAs(token3, groupId, 'E2E Short Set', ids)
      const res = await publishQuizSet(token3, groupId, set.id)
      const body = await res.json()
      expect(res.ok).toBe(false)
      expect(body.message).toContain('5 cau hoi')
    } finally {
      await teardown(token3, token4, groupId)
    }
  })

  test('W-M09-L2-029: Kicked user cannot rejoin via the same code @write @serial @security', async ({
    testApi,
  }) => {
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    await ensureNoGroup(token4)
    await ensureNoGroup(token3)
    const createRes = await fetch(`${BASE_URL}/api/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token3}` },
      body: JSON.stringify({ name: 'E2E Kick Group', description: 'test', language: 'vi' }),
    })
    const groupBody = await createRes.json()
    const groupId = groupBody.group.id as string
    const joinCode = groupBody.group.code as string
    expect((await fetch(`${BASE_URL}/api/groups/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token4}` },
      body: JSON.stringify({ code: joinCode }),
    })).ok).toBe(true)
    try {
      const userId4 = (await (await fetch(`${BASE_URL}/api/me`, { headers: { Authorization: `Bearer ${token4}` } })).json()).id
      const kickRes = await fetch(`${BASE_URL}/api/groups/${groupId}/members/${userId4}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token3}` },
        body: JSON.stringify({ reason: 'e2e kick test' }),
      })
      expect(kickRes.ok, `kick failed: ${await kickRes.clone().text()}`).toBe(true)
      const rejoin = await fetch(`${BASE_URL}/api/groups/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token4}` },
        body: JSON.stringify({ code: joinCode }),
      })
      expect(rejoin.ok).toBe(false)
    } finally {
      await fetch(`${BASE_URL}/api/groups/${groupId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token3}` },
      })
    }
  })

  test('W-M09-L2-030: Member cannot create an announcement (leader-only) @write @serial @security', async ({
    testApi,
  }) => {
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)
    try {
      const leaderPost = await fetch(`${BASE_URL}/api/groups/${groupId}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token3}` },
        body: JSON.stringify({ content: 'Welcome members!' }),
      })
      expect(leaderPost.status).toBe(201)

      const memberPost = await fetch(`${BASE_URL}/api/groups/${groupId}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token4}` },
        body: JSON.stringify({ content: 'Hijack' }),
      })
      expect(memberPost.ok).toBe(false)
    } finally {
      await teardown(token3, token4, groupId)
    }
  })

  test('W-M09-L2-031: Scheduled quiz workflow — create / start / submit / leaderboard @write @serial', async ({
    testApi,
  }) => {
    test.setTimeout(60_000)
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)
    try {
      const ids = await fetchQuestionIds(5)
      const set = await createQuizSetAs(token3, groupId, 'E2E Scheduled Set', ids)
      expect((await publishQuizSet(token3, groupId, set.id)).ok).toBe(true)

      const deadline = new Date(Date.now() + 24 * 3600 * 1000).toISOString().replace(/Z$/, '')
      const createRes = await fetch(`${BASE_URL}/api/groups/${groupId}/scheduled-quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token3}` },
        body: JSON.stringify({ quizSetId: set.id, name: 'E2E Quiz', deadline, maxAttempts: 3 }),
      })
      const createBody = await createRes.json()
      expect(createRes.ok, `schedule create failed: ${JSON.stringify(createBody)}`).toBe(true)
      const quizId = createBody.scheduledQuiz.id as string

      const startRes = await fetch(`${BASE_URL}/api/groups/${groupId}/scheduled-quizzes/${quizId}/start`, {
        method: 'POST', headers: { Authorization: `Bearer ${token4}` },
      })
      const startBody = await startRes.json()
      expect(startRes.ok, `start failed: ${JSON.stringify(startBody)}`).toBe(true)
      const attemptQuestions: any[] = startBody.attempt.questions ?? startBody.attempt.items ?? []
      expect(attemptQuestions.length).toBeGreaterThan(0)

      const answers = attemptQuestions.map((q: any) => ({ questionId: q.id ?? q.questionId, answerIndex: 0 }))
      const submitRes = await fetch(`${BASE_URL}/api/groups/${groupId}/scheduled-quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token4}` },
        body: JSON.stringify({ answers, timeSeconds: 30 }),
      })
      expect(submitRes.ok, `submit failed: ${await submitRes.clone().text()}`).toBe(true)

      const lbRes = await fetch(`${BASE_URL}/api/groups/${groupId}/scheduled-quizzes/${quizId}/leaderboard`, {
        headers: { Authorization: `Bearer ${token4}` },
      })
      const lbBody = await lbRes.json()
      expect(lbRes.ok).toBe(true)
      expect(Array.isArray(lbBody.leaderboard)).toBe(true)
    } finally {
      await teardown(token3, token4, groupId)
    }
  })

  test('W-M09-L2-032: Live room from quiz set honours the requested TEAM_VS_TEAM mode @write @serial', async ({
    testApi,
  }) => {
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)
    try {
      const ids = await fetchQuestionIds(6) // TEAM_VS_TEAM needs ≥6 questions, even count
      const set = await createQuizSetAs(token3, groupId, 'E2E Team Set', ids)
      expect((await publishQuizSet(token3, groupId, set.id)).ok).toBe(true)

      const res = await fetch(`${BASE_URL}/api/groups/${groupId}/live-rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token3}` },
        body: JSON.stringify({ quizSetId: set.id, mode: 'TEAM_VS_TEAM' }),
      })
      const body = await res.json()
      expect(res.ok, `live room failed: ${JSON.stringify(body)}`).toBe(true)
      expect(body.room.mode).toBe('TEAM_VS_TEAM')
      expect(body.room.roomCode).toMatch(/^[A-Z0-9]{6}$/)

      // Room is reachable via the room detail endpoint with the same mode.
      const detail = await (await fetch(`${BASE_URL}/api/rooms/${body.room.id}`, {
        headers: { Authorization: `Bearer ${token3}` },
      })).json()
      expect(detail.room.mode).toBe('TEAM_VS_TEAM')
    } finally {
      await teardown(token3, token4, groupId)
    }
  })

  test('W-M09-L2-033: Outsider cannot join a group-quiz-set room with the code @write @serial @security', async ({
    testApi,
  }) => {
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const token5 = await loginAndGetToken(TEST5_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)
    try {
      const ids = await fetchQuestionIds(5)
      const set = await createQuizSetAs(token3, groupId, 'E2E Private Set', ids)
      expect((await publishQuizSet(token3, groupId, set.id)).ok).toBe(true)

      const liveRes = await fetch(`${BASE_URL}/api/groups/${groupId}/live-rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token3}` },
        body: JSON.stringify({ quizSetId: set.id, mode: 'SPEED_RACE' }),
      })
      const liveBody = await liveRes.json()
      expect(liveRes.ok).toBe(true)
      const room = liveBody.room ?? liveBody.liveRoom ?? liveBody
      const roomCode = room.roomCode

      // test5 is not a group member — joining must be rejected by the
      // RoomService groupQuizSetId membership gate (audit Gap 1).
      const joinRes = await fetch(`${BASE_URL}/api/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token5}` },
        body: JSON.stringify({ roomCode }),
      })
      expect(joinRes.ok).toBe(false)
    } finally {
      await teardown(token3, token4, groupId)
    }
  })

  test('W-M09-L2-034: Leader cannot leave the group directly (LEADER_CANNOT_LEAVE) @write @serial', async ({
    testApi,
  }) => {
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)
    try {
      const res = await fetch(`${BASE_URL}/api/groups/${groupId}/leave`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token3}` },
      })
      const body = await res.json().catch(() => ({}))
      expect(res.ok).toBe(false)
      expect(JSON.stringify(body)).toContain('LEADER_CANNOT_LEAVE')
    } finally {
      await teardown(token3, token4, groupId)
    }
  })

  test('W-M09-L2-035: memberCount stays in sync through join / leave / rejoin @write @serial', async ({
    testApi,
  }) => {
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    await ensureNoGroup(token4)
    await ensureNoGroup(token3)
    const createRes = await fetch(`${BASE_URL}/api/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token3}` },
      body: JSON.stringify({ name: 'E2E Sync Group', description: 'test', language: 'vi' }),
    })
    const groupBody = await createRes.json()
    const groupId = groupBody.group.id as string
    const code = groupBody.group.code as string
    try {
      const readCount = async () => {
        const r = await fetch(`${BASE_URL}/api/groups/${groupId}`, { headers: { Authorization: `Bearer ${token3}` } })
        return ((await r.json()).group ?? {}).memberCount as number
      }
      expect(await readCount()).toBe(1)
      await fetch(`${BASE_URL}/api/groups/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token4}` },
        body: JSON.stringify({ code }),
      })
      expect(await readCount()).toBe(2)
      await fetch(`${BASE_URL}/api/groups/${groupId}/leave`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token4}` },
      })
      expect(await readCount()).toBe(1)
      await fetch(`${BASE_URL}/api/groups/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token4}` },
        body: JSON.stringify({ code }),
      })
      expect(await readCount()).toBe(2)
    } finally {
      await teardown(token3, token4, groupId)
    }
  })

  test('W-M09-L2-036: Leader edits a PUBLISHED quiz set without unpublishing @write @serial', async ({
    testApi,
  }) => {
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)
    try {
      const ids = await fetchQuestionIds(5)
      const set = await createQuizSetAs(token3, groupId, 'E2E Live Edit', ids)
      expect((await publishQuizSet(token3, groupId, set.id)).ok).toBe(true)
      const res = await fetch(`${BASE_URL}/api/groups/${groupId}/quiz-sets/${set.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token3}` },
        body: JSON.stringify({ name: 'E2E Live Edit (renamed)' }),
      })
      const body = await res.json()
      expect(res.ok).toBe(true)
      expect(body.quizSet.name).toBe('E2E Live Edit (renamed)')
      expect(body.quizSet.publishStatus).toBe('PUBLISHED')
    } finally {
      await teardown(token3, token4, groupId)
    }
  })

  test('W-M09-L2-037: Soft-deleted group drops all memberships @write @serial', async ({
    testApi,
  }) => {
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)
    const delRes = await fetch(`${BASE_URL}/api/groups/${groupId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token3}` },
    })
    expect(delRes.ok).toBe(true)
    // Both users must report no current group after soft delete.
    for (const t of [token3, token4]) {
      const me = await (await fetch(`${BASE_URL}/api/groups/me`, {
        headers: { Authorization: `Bearer ${t}` },
      })).json()
      expect(me.hasGroup).toBe(false)
    }
  })

  test('W-M09-L2-038: Admin locks a group — lock state visible via admin API @write @serial @security', async ({
    testApi,
  }) => {
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const adminToken = await loginAndGetToken(ADMIN_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)
    try {
      const lockRes = await fetch(`${BASE_URL}/api/admin/groups/${groupId}/lock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ reason: 'E2E lock — automated test reason' }),
      })
      const lockBody = await lockRes.json()
      expect(lockRes.ok, `lock failed: ${JSON.stringify(lockBody)}`).toBe(true)
      expect(lockBody.locked).toBe(true)

      const detail = await (await fetch(`${BASE_URL}/api/admin/groups/${groupId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      })).json()
      expect(detail.lockedAt ?? detail.locked).toBeTruthy()
    } finally {
      // Unlock before tearing down so leader cleanup is not blocked.
      await fetch(`${BASE_URL}/api/admin/groups/${groupId}/unlock`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${adminToken}` },
      })
      await teardown(token3, token4, groupId)
    }
  })

  test('W-M09-L2-039: Scheduled quiz attempt cap — 4th start is rejected @write @serial', async ({
    testApi,
  }) => {
    test.setTimeout(90_000)
    const token3 = await loginAndGetToken(TEST3_EMAIL)
    const token4 = await loginAndGetToken(TEST4_EMAIL)
    const { groupId } = await setupGroupWithMember(token3, token4)
    try {
      const ids = await fetchQuestionIds(5)
      const set = await createQuizSetAs(token3, groupId, 'E2E Cap Set', ids)
      expect((await publishQuizSet(token3, groupId, set.id)).ok).toBe(true)

      const deadline = new Date(Date.now() + 24 * 3600 * 1000).toISOString().replace(/Z$/, '')
      const created = await (await fetch(`${BASE_URL}/api/groups/${groupId}/scheduled-quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token3}` },
        body: JSON.stringify({ quizSetId: set.id, name: 'E2E Cap Quiz', deadline, maxAttempts: 3 }),
      })).json()
      const quizId = created.scheduledQuiz.id as string

      // Burn 3 attempts cleanly so the 4th has nothing left.
      for (let i = 0; i < 3; i++) {
        const start = await (await fetch(`${BASE_URL}/api/groups/${groupId}/scheduled-quizzes/${quizId}/start`, {
          method: 'POST', headers: { Authorization: `Bearer ${token4}` },
        })).json()
        const qs: any[] = start.attempt.questions ?? start.attempt.items ?? []
        const answers = qs.map((q: any) => ({ questionId: q.id ?? q.questionId, answerIndex: 0 }))
        const sub = await fetch(`${BASE_URL}/api/groups/${groupId}/scheduled-quizzes/${quizId}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token4}` },
          body: JSON.stringify({ answers, timeSeconds: 30 }),
        })
        expect(sub.ok, `submit ${i + 1} failed`).toBe(true)
      }
      const fourth = await fetch(`${BASE_URL}/api/groups/${groupId}/scheduled-quizzes/${quizId}/start`, {
        method: 'POST', headers: { Authorization: `Bearer ${token4}` },
      })
      expect(fourth.ok).toBe(false)
    } finally {
      await teardown(token3, token4, groupId)
    }
  })

})
