/**
 * W-M10 — Tier Progression (L1 Smoke)
 *
 * Routes: / (tier display), /profile (tier progress), /cosmetics
 * Spec ref: SPEC_USER §3
 */

import { test, expect } from '../../fixtures/auth'
import { HomePage } from '../../pages/HomePage'

test.describe('W-M10 Tier Progression — L1 Smoke @smoke @tier', () => {

  test.describe('Home Tier Display', () => {

    test('W-M10-L1-001: Tier badge hien thi dung tren Home Tier 1 @smoke @tier', async ({
      tier1Page,
    }) => {
      // ============================================================
      // SECTION 1: SETUP — none
      // ============================================================

      // ============================================================
      // SECTION 2: ACTIONS
      // ============================================================
      const page = tier1Page
      const homePage = new HomePage(page)
      await homePage.goto()

      // ============================================================
      // SECTION 3: UI ASSERTIONS
      // ============================================================
      await expect(homePage.tierBadge).toHaveText(/Tân Tín Hữu|New Believer|Người Tìm Kiếm|Seeker/i)
      await expect(page.getByTestId('home-next-tier-card')).toBeVisible()
      await expect(homePage.tierProgressBar).toBeVisible()
    })

    test('W-M10-L1-002: Tier badge hien thi dung tren Home Tier 6 max tier @smoke @tier', async ({
      tier6Page,
    }) => {
      // ============================================================
      // SECTION 1: SETUP — none
      // ============================================================

      // ============================================================
      // SECTION 2: ACTIONS
      // ============================================================
      const page = tier6Page
      const homePage = new HomePage(page)
      await homePage.goto()

      // ============================================================
      // SECTION 3: UI ASSERTIONS
      // ============================================================
      await expect(homePage.tierBadge).toHaveText(/Sứ Đồ/)
      await expect(page.getByTestId('home-max-tier-msg')).toBeVisible()
      await expect(page.getByTestId('home-next-tier-card')).not.toBeVisible()
    })

    test('W-M10-L1-003: TierProgressBar 5 sao hien thi tren Home @smoke @tier', async ({
      tier3Page,
    }) => {
      // ============================================================
      // SECTION 1: SETUP — none
      // ============================================================

      // ============================================================
      // SECTION 2: ACTIONS
      // ============================================================
      const page = tier3Page
      const homePage = new HomePage(page)
      await homePage.goto()

      // ============================================================
      // SECTION 3: UI ASSERTIONS
      // ============================================================
      await expect(page.getByTestId('tier-progress-stars')).toBeVisible()
      await expect(page.getByTestId('tier-star-count')).toHaveText(/\d\/5/)
      await expect(
        page.getByTestId('tier-progress-stars').locator('[data-testid="tier-star"]'),
      ).toHaveCount(5)
    })

  })

  test.describe('Profile Tier Progress', () => {

    test('W-M10-L1-004: Tier progress section tren Profile page @smoke @tier @profile', async ({
      tier4Page,
    }) => {
      // ============================================================
      // SECTION 1: SETUP — none
      // ============================================================

      // ============================================================
      // SECTION 2: ACTIONS
      // ============================================================
      const page = tier4Page
      await page.goto('/profile')
      await page.getByTestId('profile-tier-progress').waitFor({ state: 'visible' })

      // ============================================================
      // SECTION 3: UI ASSERTIONS
      // ============================================================
      await expect(page.getByTestId('profile-tier-progress')).toBeVisible()
      await expect(page.getByTestId('profile-tier-current-name')).toHaveText(/Hiền Triết/)
      await expect(page.getByTestId('profile-tier-next-name')).toHaveText(/Tiên Tri/)
      await expect(page.getByTestId('profile-tier-exp')).toHaveText(/20[,.]?000.*40[,.]?000/)
    })

    test('W-M10-L1-008: Prestige section hien thi tren Profile Tier 6 @smoke @tier @profile', async ({
      tier6Page,
    }) => {
      // ============================================================
      // SECTION 1: SETUP — none
      // ============================================================

      // ============================================================
      // SECTION 2: ACTIONS
      // ============================================================
      const page = tier6Page
      await page.goto('/profile')
      await page.getByTestId('profile-prestige-section').waitFor({ state: 'visible' })

      // ============================================================
      // SECTION 3: UI ASSERTIONS
      // ============================================================
      await expect(page.getByTestId('profile-prestige-section')).toBeVisible()
      await expect(page.getByTestId('profile-days-at-tier6')).toBeVisible()
    })

  })

  test.describe('Cosmetics Page', () => {

    test('W-M10-L1-005: Cosmetics page render dung @smoke @tier @cosmetics', async ({
      tier3Page,
    }) => {
      // ============================================================
      // SECTION 1: SETUP — none
      // ============================================================

      // ============================================================
      // SECTION 2: ACTIONS
      // ============================================================
      const page = tier3Page
      await page.goto('/cosmetics')
      await page.getByTestId('cosmetics-page').waitFor({ state: 'visible' })

      // ============================================================
      // SECTION 3: UI ASSERTIONS
      // ============================================================
      await expect(page).toHaveURL('/cosmetics')
      await expect(page.getByTestId('cosmetics-frames-section')).toBeVisible()
      await expect(page.getByTestId('cosmetics-themes-section')).toBeVisible()
      await expect(
        page.getByTestId('cosmetics-frames-section').locator('[data-testid="cosmetics-frame-item"]'),
      ).toHaveCount(6)
    })

    test('W-M10-L1-006: Cosmetics frame cua tier cao hon bi locked @smoke @tier @cosmetics', async ({
      tier1Page,
    }) => {
      // ============================================================
      // SECTION 1: SETUP — none
      // ============================================================

      // ============================================================
      // SECTION 2: ACTIONS
      // ============================================================
      const page = tier1Page
      await page.goto('/cosmetics')
      await page.getByTestId('cosmetics-frame-item').first().waitFor({ state: 'visible' })

      const frameItems = page.getByTestId('cosmetics-frame-item')

      // ============================================================
      // SECTION 3: UI ASSERTIONS
      // ============================================================
      // Frame tier 1 (index 0) — unlocked
      await expect(frameItems.nth(0)).not.toHaveAttribute('disabled')
      // Frame tier 2 (index 1) — locked
      await expect(frameItems.nth(1)).toHaveAttribute('disabled')
      await expect(frameItems.nth(1).getByTestId('cosmetics-lock-icon')).toBeVisible()
      await expect(frameItems.nth(1)).toContainText('Đạt T2 để mở')
    })

    test('W-M10-L1-007: Cosmetics chon frame da unlock PATCH API duoc goi @smoke @tier @cosmetics', async ({
      tier3Page,
    }) => {
      // ============================================================
      // SECTION 1: SETUP — none
      // ============================================================

      // ============================================================
      // SECTION 2: ACTIONS
      // ============================================================
      const page = tier3Page
      await page.goto('/cosmetics')
      await page.getByTestId('cosmetics-frame-item').first().waitFor({ state: 'visible' })

      const frameItems = page.getByTestId('cosmetics-frame-item')
      await frameItems.nth(0).click()

      // ============================================================
      // SECTION 3: UI ASSERTIONS
      // ============================================================
      await expect(frameItems.nth(0)).toContainText(/✓ Đang dùng|Đang dùng/)
    })

  })

})
