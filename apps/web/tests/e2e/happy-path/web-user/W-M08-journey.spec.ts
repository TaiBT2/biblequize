/**
 * W-M08 — Bible Journey Map (L2 Happy Path)
 *
 * Routes: /journey
 * Spec ref: SPEC_USER §6
 */

import { test, expect } from '../../fixtures/auth'

// ── Tests ───────────────────────────────────────────────────────────

test.describe('W-M08 Journey Map — L2 Happy Path @happy-path @journey', () => {

  test('W-M08-L2-001: GET /api/me/journey returns summary + 66 books array @parallel-safe', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    const res = await page.request.get('/api/me/journey')

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    expect(res.ok()).toBe(true)
    const data = await res.json()

    // Summary fields
    expect(data).toHaveProperty('summary')
    expect(data.summary).toHaveProperty('totalBooks')
    expect(data.summary).toHaveProperty('completedBooks')
    expect(data.summary).toHaveProperty('overallMastery')

    // Books array — 66 books of Bible
    expect(data).toHaveProperty('books')
    expect(data.books).toHaveLength(66)

    // Each book has required fields
    for (const book of data.books) {
      expect(book).toHaveProperty('bookCode')
      expect(book).toHaveProperty('bookName')
      expect(book).toHaveProperty('testament')
      expect(book).toHaveProperty('mastery')
      expect(book).toHaveProperty('unlocked')
      expect(['OT', 'NT']).toContain(book.testament)
    }

    // 39 OT + 27 NT
    const otBooks = data.books.filter((b: any) => b.testament === 'OT')
    const ntBooks = data.books.filter((b: any) => b.testament === 'NT')
    expect(otBooks).toHaveLength(39)
    expect(ntBooks).toHaveLength(27)
  })

  test('W-M08-L2-002: Mastery formula verification — pre-seed history, verify mastery @write @serial', async ({
    testApi,
  }) => {
    // [NEEDS CODE READ]: mock-history endpoint + exact mastery formula
    test.skip(true, 'BLOCKED: Needs mock-history admin endpoint for deterministic mastery test')

    // ============================================================
    // SECTION 1: SETUP
    // ============================================================
    // await testApi.resetHistory('test3@dev.local')
    // POST mock-history?book=Genesis&percentSeen=50&percentWrong=20

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    // GET /api/me/journey

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    // Find Genesis in books[], verify mastery matches formula
  })

  test('W-M08-L2-003: Tier 1 user — limited books unlocked @parallel-safe', async ({
    tier1Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier1Page
    const res = await page.request.get('/api/me/journey')

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    expect(res.ok()).toBe(true)
    const data = await res.json()

    const unlocked = data.books.filter((b: any) => b.unlocked)
    const locked = data.books.filter((b: any) => !b.unlocked)

    // Tier 1 should have limited unlocked books (not all 66)
    expect(unlocked.length).toBeGreaterThan(0)
    expect(locked.length).toBeGreaterThan(0)
    expect(unlocked.length).toBeLessThan(66)
  })

  test('W-M08-L2-004: Tier 6 user — all 66 books unlocked @parallel-safe', async ({
    tier6Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier6Page
    const res = await page.request.get('/api/me/journey')

    // ============================================================
    // SECTION 3: UI ASSERTIONS — N/A
    // ============================================================

    // ============================================================
    // SECTION 4: API VERIFICATION
    // ============================================================
    expect(res.ok()).toBe(true)
    const data = await res.json()

    const unlocked = data.books.filter((b: any) => b.unlocked)
    expect(unlocked).toHaveLength(66)
  })

  test('W-M08-L2-005: Journey UI — OT/NT sections + book cards rendered @parallel-safe', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/journey')

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await expect(page.getByTestId('journey-page')).toBeVisible()
    await expect(page.getByTestId('journey-summary-card')).toBeVisible()

    // OT section — journey-old-testament contains OT book cards
    const otSection = page.getByTestId('journey-old-testament')
    await expect(otSection).toBeVisible()

    const otCards = otSection.locator('[data-testid^="journey-book-card-"]')
    await expect(otCards.first()).toBeVisible()
    const otCount = await otCards.count()
    expect(otCount).toBe(39)

    // NT section — journey-new-testament contains NT book cards
    const ntSection = page.getByTestId('journey-new-testament')
    await expect(ntSection).toBeVisible()

    const ntCards = ntSection.locator('[data-testid^="journey-book-card-"]')
    await expect(ntCards.first()).toBeVisible()
    const ntCount = await ntCards.count()
    expect(ntCount).toBe(27)
  })

  test('W-M08-L2-006: Click book card navigates to Practice with book filter @parallel-safe', async ({
    tier3Page,
  }) => {
    // ============================================================
    // SECTION 1: SETUP — none
    // ============================================================

    // ============================================================
    // SECTION 2: ACTIONS
    // ============================================================
    const page = tier3Page
    await page.goto('/journey')
    await page.waitForSelector('[data-testid="journey-page"]')

    // Click on Genesis book card (within OT section)
    const otSection = page.getByTestId('journey-old-testament')
    await expect(otSection).toBeVisible()
    const genesisCard = page.getByTestId('journey-book-card-Genesis')
    await expect(genesisCard).toBeVisible()
    await genesisCard.click()

    // ============================================================
    // SECTION 3: UI ASSERTIONS
    // ============================================================
    await page.waitForURL(/\/practice/)
    await expect(page).toHaveURL(/\/practice\?book=Genesis/)
  })

})
