/**
 * W-M02 — Home & Profile (L1 Smoke)
 *
 * Routes: /, /profile
 * Spec ref: SPEC_USER S13
 */

import { test as authTest, expect as authExpect } from '../../fixtures/auth'
import { expect } from '@playwright/test'
import { HomePage } from '../../pages/HomePage'

// ────────────────────────────────────────────────────────────────
// W-M02 Home & Profile — L1 Smoke
// ────────────────────────────────────────────────────────────────

authTest.describe('W-M02 Home & Profile — L1 Smoke', () => {
  // ── W-M02-L1-001 ── storageState=tier3 ───────────────────
  authTest(
    'W-M02-L1-001: Home page render dung cho user da dang nhap @smoke @home @critical',
    async ({ tier3Page }) => {
      // ── Setup ──
      const homePage = new HomePage(tier3Page)

      // ── Actions ──
      await homePage.goto()

      // ── UI Assertions ──
      await authExpect(tier3Page).toHaveURL('/')
      await authExpect(homePage.container).toBeVisible()
      await authExpect(homePage.gameModeGrid).toBeVisible()
      // TODO [NEEDS TESTID: home-tier-badge]
      await authExpect(homePage.tierBadge).toBeVisible()
      // TODO [NEEDS TESTID: home-greeting]
      await authExpect(homePage.greeting).toBeVisible()
    },
  )

  // ── W-M02-L1-002 ── storageState=tier3 ───────────────────
  authTest(
    'W-M02-L1-002: Game mode grid hien thi du cac modes @smoke @home',
    async ({ tier3Page }) => {
      // ── Actions ──
      await tier3Page.goto('/')
      await tier3Page.waitForSelector('[data-testid="game-mode-grid"]')

      // ── UI Assertions ──
      await authExpect(tier3Page.getByTestId('game-mode-grid')).toBeVisible()
      // TODO [NEEDS TESTID: game-mode-practice, game-mode-ranked, game-mode-daily]
      await authExpect(
        tier3Page.getByTestId('game-mode-practice'),
      ).toBeVisible()
      await authExpect(
        tier3Page.getByTestId('game-mode-ranked'),
      ).toBeVisible()
      await authExpect(tier3Page.getByTestId('game-mode-daily')).toBeVisible()
    },
  )

  // ── W-M02-L1-003 ── storageState=tier3 ───────────────────
  authTest(
    'W-M02-L1-003: Tier progress bar hien thi tren Home @smoke @home @tier',
    async ({ tier3Page }) => {
      // ── Actions ──
      await tier3Page.goto('/')
      // TODO [NEEDS TESTID: home-tier-badge]
      await tier3Page.waitForSelector('[data-testid="home-tier-badge"]')

      // ── UI Assertions ──
      await authExpect(tier3Page.getByTestId('home-tier-badge')).toHaveText(
        /Môn Đồ/,
      )
      // TODO [NEEDS TESTID: home-tier-progress-bar]
      await authExpect(
        tier3Page.getByTestId('home-tier-progress-bar'),
      ).toBeVisible()
      // TODO [NEEDS TESTID: home-next-tier-card]
      await authExpect(
        tier3Page.getByTestId('home-next-tier-card'),
      ).toBeVisible()
    },
  )

  // ── W-M02-L1-004 ── storageState=tier3 ───────────────────
  authTest(
    'W-M02-L1-004: Leaderboard section hien thi va toggle Daily/Weekly @smoke @home',
    async ({ tier3Page }) => {
      // ── Setup ──
      const homePage = new HomePage(tier3Page)

      // ── Actions ──
      await homePage.goto()
      // TODO [NEEDS TESTID: home-leaderboard]
      await tier3Page.waitForSelector('[data-testid="home-leaderboard"]')
      await homePage.selectLeaderboardTab('daily')
      await homePage.selectLeaderboardTab('weekly')

      // ── UI Assertions ──
      await authExpect(homePage.leaderboardSection).toBeVisible()
      // TODO [NEEDS TESTID: leaderboard-tab-daily, leaderboard-tab-weekly]
      await authExpect(homePage.leaderboardTabDaily).toBeVisible()
      await authExpect(homePage.leaderboardTabWeekly).toBeVisible()
      // TODO [NEEDS TESTID: leaderboard-row]
      const rows = homePage.leaderboardSection.locator(
        '[data-testid="leaderboard-row"]',
      )
      expect(await rows.count()).toBeGreaterThanOrEqual(1)
    },
  )

  // ── W-M02-L1-005 ── storageState=tier3 ───────────────────
  authTest(
    'W-M02-L1-005: Daily missions card hien thi @smoke @home',
    async ({ tier3Page }) => {
      // ── Actions ──
      await tier3Page.goto('/')
      // TODO [NEEDS TESTID: home-daily-missions]
      await tier3Page.waitForSelector('[data-testid="home-daily-missions"]')

      // ── UI Assertions ──
      await authExpect(
        tier3Page.getByTestId('home-daily-missions'),
      ).toBeVisible()
      // TODO [NEEDS TESTID: mission-item]
      const missionItems = tier3Page
        .getByTestId('home-daily-missions')
        .locator('[data-testid="mission-item"]')
      expect(await missionItems.count()).toBe(3)
    },
  )

  // ── W-M02-L1-006 ── storageState=tier3 ───────────────────
  authTest(
    'W-M02-L1-006: Navigate tu game mode card sang dung route @smoke @home',
    async ({ tier3Page }) => {
      // ── Setup ──
      const homePage = new HomePage(tier3Page)

      // ── Actions ──
      await homePage.goto()
      // TODO [NEEDS TESTID: game-mode-practice]
      await tier3Page.waitForSelector('[data-testid="game-mode-practice"]')
      await homePage.clickGameMode('practice')

      // ── UI Assertions ──
      await authExpect(tier3Page).toHaveURL('/practice')
    },
  )

  // ── W-M02-L1-007 ── storageState=tier3 ───────────────────
  // SKIP: UI components profile-user-name, profile-tier-progress not implemented yet
  authTest.skip(
    'W-M02-L1-007: Profile page render dung @smoke @profile',
    async ({ tier3Page }) => {
      // ── Actions ──
      await tier3Page.goto('/profile')
      // TODO [NEEDS TESTID: profile-page]
      await tier3Page.waitForSelector('[data-testid="profile-page"]')

      // ── UI Assertions ──
      await authExpect(tier3Page).toHaveURL('/profile')
      // TODO [NEEDS TESTID: profile-user-name]
      await authExpect(
        tier3Page.getByTestId('profile-user-name'),
      ).toBeVisible()
      // TODO [NEEDS TESTID: profile-tier-badge]
      await authExpect(
        tier3Page.getByTestId('profile-tier-badge'),
      ).toBeVisible()
      // TODO [NEEDS TESTID: profile-tier-progress]
      await authExpect(
        tier3Page.getByTestId('profile-tier-progress'),
      ).toBeVisible()
      // TODO [NEEDS TESTID: profile-stats-points]
      await authExpect(
        tier3Page.getByTestId('profile-stats-points'),
      ).toBeVisible()
      // TODO [NEEDS TESTID: profile-stats-streak]
      await authExpect(
        tier3Page.getByTestId('profile-stats-streak'),
      ).toBeVisible()
    },
  )

  // ── W-M02-L1-008 ── storageState=tier3 ───────────────────
  authTest(
    'W-M02-L1-008: Profile Achievement badges section visible @smoke @profile',
    async ({ tier3Page }) => {
      // ── Actions ──
      await tier3Page.goto('/profile')
      // TODO [NEEDS TESTID: profile-badges-section]
      await tier3Page.waitForSelector('[data-testid="profile-badges-section"]')

      // ── UI Assertions ──
      await authExpect(
        tier3Page.getByTestId('profile-badges-section'),
      ).toBeVisible()
      // TODO [NEEDS TESTID: profile-heatmap]
      await authExpect(tier3Page.getByTestId('profile-heatmap')).toBeVisible()
    },
  )

  // ── W-M02-L1-009 ── fresh login as test3@dev.local ───────
  // SKIP: UI component delete-account-modal not implemented yet
  authTest.skip(
    'W-M02-L1-009: Profile Delete account modal mo/dong @smoke @profile @write',
    async ({ page }) => {
      // ── Setup — fresh login ──
      await page.goto('/login')
      await page.getByTestId('login-email-input').fill('test3@dev.local')
      await page.getByTestId('login-password-input').fill('Test@123456')
      await page.getByTestId('login-submit-btn').click()
      await page.waitForURL('/')

      // ── Actions ──
      await page.goto('/profile')
      await page.waitForSelector('[data-testid="profile-page"]')
      // TODO [NEEDS TESTID: profile-delete-account-btn]
      await page.getByTestId('profile-delete-account-btn').click()
      // TODO [NEEDS TESTID: delete-account-modal]
      await page.waitForSelector('[data-testid="delete-account-modal"]')

      // ── UI Assertions — modal open ──
      await expect(page.getByTestId('delete-account-modal')).toBeVisible()
      // TODO [NEEDS TESTID: profile-delete-confirm-input]
      await expect(
        page.getByTestId('profile-delete-confirm-input'),
      ).toBeVisible()

      // ── Actions — close modal ──
      // TODO [NEEDS TESTID: delete-account-cancel-btn]
      await page.getByTestId('delete-account-cancel-btn').click()

      // ── UI Assertions — modal closed ──
      await expect(
        page.getByTestId('delete-account-modal'),
      ).not.toBeVisible()
    },
  )
})
