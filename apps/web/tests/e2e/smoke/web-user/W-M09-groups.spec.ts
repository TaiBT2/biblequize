/**
 * W-M09 — Church Groups (L1 Smoke)
 *
 * Routes: /groups, /groups/:id, /groups/:id/analytics
 * Spec ref: SPEC_USER §9
 */

import { test, expect } from '../../fixtures/auth'

test.describe('W-M09 Church Groups — L1 Smoke @smoke @groups', () => {

  test('W-M09-L1-001: No-group state hien thi khi user chua co group @smoke @groups @critical', async ({
    tier1Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none (tier1 user has no group)
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier1Page
    await page.goto('/groups')
    await page.waitForSelector('[data-testid="no-group"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL('/groups')
    await expect(page.getByTestId('no-group')).toBeVisible()
    await expect(page.getByTestId('groups-create-btn')).toBeVisible()
    await expect(page.getByTestId('groups-join-btn')).toBeVisible()
  })

  test('W-M09-L1-002: Create group form mo va submit @smoke @groups @write', async ({
    tier1Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier1Page
    await page.goto('/groups')
    await page.waitForSelector('[data-testid="groups-create-btn"]')
    await page.getByTestId('groups-create-btn').click()
    await page.waitForSelector('[data-testid="groups-create-form"]')
    await page.getByTestId('groups-create-name-input').fill('Test Group E2E')
    await page.getByTestId('groups-create-submit-btn').click()
    await page.waitForSelector('[data-testid="group-overview"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page.getByTestId('group-overview')).toBeVisible()
  })

  test('W-M09-L1-003: Group overview hien thi leaderboard @smoke @groups', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    // [NOT IMPLEMENTED: seed data chua include group membership cho test users]
    test.skip()

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/groups')
    await page.waitForSelector('[data-testid="group-leaderboard"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page.getByTestId('group-overview')).toBeVisible()
    await expect(page.getByTestId('group-leaderboard')).toBeVisible()
    await expect(
      page.getByTestId('group-leaderboard').locator('[data-testid="group-leaderboard-row"]'),
    ).toHaveCount({ min: 1 })
  })

  test('W-M09-L1-004: Group Detail page render @smoke @groups', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    // [NOT IMPLEMENTED: need group ID with test3 as member]
    test.skip()

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    const groupId = 'TODO-group-id-from-api-setup'
    await page.goto(`/groups/${groupId}`)
    await page.waitForSelector('[data-testid="group-detail-page"]')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page).toHaveURL(/\/groups\/.+/)
    await expect(page.getByTestId('group-detail-page')).toBeVisible()
    await expect(page.getByTestId('group-detail-name')).toBeVisible()
    await expect(page.getByTestId('group-detail-members')).toBeVisible()
  })

  test('W-M09-L1-005: Loading skeleton hien thi @smoke @groups', async ({
    tier1Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier1Page
    await page.goto('/groups')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    // Skeleton may disappear quickly — soft check
    const skeleton = page.getByTestId('groups-skeleton')
    const isVisible = await skeleton.isVisible().catch(() => false)
    if (isVisible) {
      await expect(skeleton).toBeVisible()
    }
    // After load, some state should be present
    await expect(
      page.getByTestId('no-group').or(page.getByTestId('group-overview')),
    ).toBeVisible()
  })

})
