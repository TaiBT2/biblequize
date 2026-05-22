# PROMPT: E2E Seed Infrastructure + 3 Critical W-M07 Tests (Light Version)

## Mục tiêu

Build **minimal E2E seed infrastructure** + **3 critical Playwright tests** cho launch confidence. Defer comprehensive E2E suite (W-M07-001/003/004/005/006) post-launch.

## Context

**Status:**
- ✅ BE Liturgical Coverage + Badge system complete
- ✅ FE Web modals (Pool/Week/Badge) shipped
- ✅ 22 unit tests pass (modal logic)
- ⚠️ E2E W-M07 deferred — cần seed infra

**Bui's decision Q3 = (a):** Build comprehensive E2E.

**Tôi pivot recommendation sang light version** vì:
1. Comprehensive E2E (6+ tests) cần ~2 ngày, light (3 critical) cần ~1.5 ngày — diff không lớn
2. 3 critical tests cover 80% risk paths
3. v1.1 có thể extend post-launch khi có user feedback

**3 critical tests chosen:**
- W-M07-002: Week complete flow (most complex UX — defer-to-results pattern)
- W-M07-007: Pool exhaustion modal (critical error path)
- W-M07-008: Badge award flow (multi-API interaction)

**Output:** 1 seed infra commit + 3 E2E test commits = 4 commits.

---

## Canonical constraints (Bui-locked)

- Spec: `docs/spec/SPEC_USER_v3.2.md §7.15.3`
- Playwright config existing at `apps/web/playwright.config.ts` (verify path in Phase 1)
- E2E test naming: `W-M07-XXX` per SPEC §7.15.3
- Test DB: existing setup (verify in Phase 1)
- Feature flag: `liturgical_coverage_enabled` must be ON during tests

---

## Phase 1: Pre-flight audit

### 1.1 Playwright + test infra inventory

```bash
# Verify Playwright config
find apps/web -name "playwright.config.*" -type f

# Existing E2E tests structure
find apps/web/e2e -type f -name "*.spec.*" 2>/dev/null | head -10

# Existing test helpers
find apps/web/e2e -type d -name "helpers" 2>/dev/null
find apps/web/e2e -name "fixtures*" -type f 2>/dev/null

# Test DB / API setup pattern
grep -rn "TEST_DB\|test.*database\|playwright.*setup" apps/web/playwright.config.ts apps/web/e2e/ 2>/dev/null | head -10
```

### 1.2 BE seed endpoint availability

```bash
# Check if BE has test-only seed endpoints
grep -rn "@TestOnly\|/api/test/\|test-helper\|seedUser" apps/api/src/ 2>/dev/null | head -10

# Check if Flyway test profile exists
find apps/api/src/test -name "application*.yml" -o -name "application*.properties" 2>/dev/null
```

### 1.3 Existing auth pattern in E2E

```bash
# How current E2E tests authenticate
grep -rn "login\|authenticate\|setSession" apps/web/e2e/ 2>/dev/null | head -10
```

### 1.4 Audit summary inline

```markdown
## E2E Audit Summary

### Playwright setup
- Config file: [path]
- Test directory: [path]
- Helpers directory: [exists / TO CREATE at e2e/helpers/]

### Existing E2E count
- Files: [N]
- Tests: ~[N]
- Most recent: [filename]

### BE seed endpoints
- Test endpoint exists: [yes - list / no - need to add or seed via DB direct]

### Test DB strategy
- [Testcontainers / docker-compose / shared dev DB / in-memory]

### Auth pattern in tests
- [JWT mock / login flow / setSession helper]

### Open questions for Bui
1. [Anything ambiguous]
```

**STOP after audit. Wait for Bui review.**

If BE seed endpoints absent → may need separate BE PROMPT to add `@TestOnly` endpoints before E2E can proceed. Flag in audit.

---

## Phase 2: Implementation (4 commits)

### Commit 1: Seed infrastructure helpers

**Files:**
- `apps/web/e2e/helpers/seed.ts` — TO CREATE
- `apps/web/e2e/helpers/auth.ts` — TO CREATE (if not exists)
- `apps/web/e2e/helpers/coverage.ts` — TO CREATE
- `apps/web/e2e/fixtures/test-users.ts` — TO CREATE

#### `seed.ts` — Core seed functions

```typescript
import { APIRequestContext } from '@playwright/test';

export interface SeedUserOptions {
  email?: string;
  tier?: number;
  language?: 'vi' | 'en';
  energy?: number;
}

export interface SeedCoverageOptions {
  userId: string;
  seasonCode: 'EASTER' | 'PENTECOST' | 'THANKSGIVING' | 'CHRISTMAS';
  currentWeek?: number;
  bookCoverage?: Record<string, number>;  // e.g., {"Genesis": 12, "Joshua": 4}
}

export interface SeedBadgeOptions {
  userId: string;
  seasonCode: string;
  badgeTier: 'TOAN_THU' | 'TAN_TAM' | 'HANH_HUONG';
  unshown?: boolean;
}

/**
 * Create test user with specified tier + language.
 * Uses BE test-only endpoint or direct DB insert (per Phase 1 audit).
 */
export async function seedTestUser(
  api: APIRequestContext,
  opts: SeedUserOptions
): Promise<{ userId: string; token: string }> {
  // Implementation depends on BE test endpoint availability
  // Option A — POST /api/test/users (if BE provides)
  // Option B — direct DB insert + JWT generation
  // Phase 1 audit decides which path
}

/**
 * Seed UserSeasonCoverage row for test user.
 * Allows testing specific scenarios (5/6 books covered, etc.).
 */
export async function seedCoverage(
  api: APIRequestContext,
  opts: SeedCoverageOptions
): Promise<void> {
  // ...
}

/**
 * Seed UserSeasonBadge for testing BadgeAwardModal.
 */
export async function seedBadge(
  api: APIRequestContext,
  opts: SeedBadgeOptions
): Promise<void> {
  // ...
}

/**
 * Clean up test data (call in afterEach).
 */
export async function cleanupTestUser(
  api: APIRequestContext,
  userId: string
): Promise<void> {
  // Cascade delete user → coverage → badges
}
```

#### `auth.ts` — Authentication helpers

```typescript
import { Page, BrowserContext } from '@playwright/test';

/**
 * Authenticate test user via API + set session in browser context.
 * Skip UI login flow for E2E speed.
 */
export async function authAs(
  context: BrowserContext,
  token: string,
  userId: string
): Promise<void> {
  await context.addCookies([
    {
      name: 'auth_token',
      value: token,
      domain: 'localhost',
      path: '/',
    },
  ]);
  // Or use localStorage.setItem based on actual auth pattern
}
```

#### `coverage.ts` — Coverage-specific helpers

```typescript
import { Page } from '@playwright/test';

/**
 * Complete N answer questions in current quiz session.
 * Returns when N answers submitted.
 */
export async function answerNQuestions(
  page: Page,
  count: number,
  options?: { correct?: boolean }
): Promise<void> {
  for (let i = 0; i < count; i++) {
    await page.click('.question-card .answer-option:first-child');  // Adjust selector
    await page.click('button:has-text("Tiếp tục"), button:has-text("Continue")');
  }
}

/**
 * Complete the entire 10-question batch.
 */
export async function completeAllQuestions(page: Page): Promise<void> {
  await answerNQuestions(page, 10);
}

/**
 * Force pool exhaustion scenario by exhausting all available questions.
 * Requires seed with `smallPool: true` option.
 */
export async function exhaustQuestionPool(page: Page): Promise<void> {
  // Keep clicking play + completing until no more questions
  let attempts = 0;
  const maxAttempts = 20;
  
  while (attempts < maxAttempts) {
    const playBtn = page.locator('button:has-text("Bắt đầu")');
    if (!(await playBtn.isVisible())) break;
    
    await playBtn.click();
    
    // Check if pool exhausted modal appears
    const exhaustedModal = page.locator('text=Pool Tuần Cạn');
    if (await exhaustedModal.isVisible({ timeout: 1000 }).catch(() => false)) {
      return;
    }
    
    await completeAllQuestions(page);
    attempts++;
  }
}
```

#### `fixtures/test-users.ts` — Common test user configs

```typescript
export const TEST_USERS = {
  TIER_1_VI: {
    email: 'test-tier1@bibleQuiz.test',
    tier: 1,
    language: 'vi' as const,
  },
  TIER_4_VI: {
    email: 'test-tier4@bibleQuiz.test',
    tier: 4,
    language: 'vi' as const,
  },
  TIER_6_VI: {
    email: 'test-tier6@bibleQuiz.test',
    tier: 6,
    language: 'vi' as const,
  },
} as const;
```

**Commit message:**
```
test(e2e): seed infrastructure helpers for coverage tests

- seed.ts: user/coverage/badge seeding
- auth.ts: skip UI login for E2E speed
- coverage.ts: answerNQuestions, completeAllQuestions, exhaustQuestionPool
- fixtures/test-users.ts: common test user configs

Foundation for W-M07-002/007/008.

Refs: SPEC_USER_v3.2 §7.15.3
```

### Commit 2: W-M07-002 — Week complete flow

**File:** `apps/web/e2e/ranked/week-complete.spec.ts` — TO CREATE

```typescript
import { test, expect } from '@playwright/test';
import { seedTestUser, seedCoverage, cleanupTestUser } from '../helpers/seed';
import { authAs } from '../helpers/auth';
import { completeAllQuestions } from '../helpers/coverage';
import { TEST_USERS } from '../fixtures/test-users';

test.describe('W-M07-002: Week complete flow', () => {
  let userId: string;
  let token: string;
  
  test.beforeEach(async ({ request, context }) => {
    // Seed user with 5/6 books covered in current week
    const user = await seedTestUser(request, TEST_USERS.TIER_4_VI);
    userId = user.userId;
    token = user.token;
    
    await seedCoverage(request, {
      userId,
      seasonCode: 'EASTER',
      currentWeek: 3,
      bookCoverage: {
        'Leviticus': 12,
        'Joel': 5,
        'Nahum': 4,
        'Malachi': 4,
        'Hosea': 4,
        'Amos': 3,  // 5/6 covered, Amos needs 1 more tick
      },
    });
    
    await authAs(context, token, userId);
  });
  
  test.afterEach(async ({ request }) => {
    await cleanupTestUser(request, userId);
  });
  
  test('completes week → modal on results → unlock next week', async ({ page }) => {
    await page.goto('/ranked');
    await page.click('button:has-text("Bắt đầu")');
    
    // Assert: NO modal during quiz
    await expect(
      page.locator('[role="dialog"]:has-text("HOÀN THÀNH TUẦN")')
    ).not.toBeVisible();
    
    // Complete all 10 questions (should tick Amos to ≥4)
    await completeAllQuestions(page);
    
    // Assert: Quiz results page reached
    await expect(page.locator('text=Kết quả')).toBeVisible({ timeout: 5000 });
    
    // Assert: WeekCompleteModal appears (~800ms delay)
    await expect(
      page.locator('text=HOÀN THÀNH TUẦN 3')
    ).toBeVisible({ timeout: 2000 });
    await expect(page.locator('text=Chinh phục 6 sách')).toBeVisible();
    
    // Assert: Next week books displayed
    const bookPills = page.locator('[data-testid="book-pill"]');
    await expect(bookPills).toHaveCount(6);
    
    // Action: Tap unlock CTA
    await page.click('button:has-text("Bắt đầu tuần 4")');
    
    // Assert: Navigate to Ranked entry + week 4 active
    await expect(page).toHaveURL(/\/ranked/);
    await expect(page.locator('text=Tuần 4')).toBeVisible({ timeout: 3000 });
  });
  
  test('defer CTA keeps user on results page', async ({ page }) => {
    await page.goto('/ranked');
    await page.click('button:has-text("Bắt đầu")');
    await completeAllQuestions(page);
    
    await expect(page.locator('text=HOÀN THÀNH TUẦN 3')).toBeVisible();
    
    // Tap "Để mai chơi"
    await page.click('button:has-text("Để mai chơi")');
    
    // Assert: Modal closes, user stays on results
    await expect(page.locator('text=HOÀN THÀNH TUẦN 3')).not.toBeVisible();
    await expect(page.locator('text=Kết quả')).toBeVisible();
  });
});
```

**Commit message:**
```
test(e2e): W-M07-002 week complete flow

Verifies Option B defer-to-results pattern:
- NO modal during quiz session (no q8-10 blocking)
- Modal appears on results page after ~800ms
- Unlock CTA navigates to next week
- Defer CTA keeps user on results

Refs: SPEC_USER_v3.2 §7.1.5
```

### Commit 3: W-M07-007 — Pool exhaustion modal

**File:** `apps/web/e2e/ranked/pool-exhaustion.spec.ts` — TO CREATE

```typescript
import { test, expect } from '@playwright/test';
import { seedTestUser, seedCoverage, cleanupTestUser } from '../helpers/seed';
import { authAs } from '../helpers/auth';
import { exhaustQuestionPool } from '../helpers/coverage';
import { TEST_USERS } from '../fixtures/test-users';

test.describe('W-M07-007: Pool exhaustion modal', () => {
  let userId: string;
  
  test.beforeEach(async ({ request, context }) => {
    const user = await seedTestUser(request, TEST_USERS.TIER_4_VI);
    userId = user.userId;
    
    // Seed: 6 books all covered → user at edge of pool
    await seedCoverage(request, {
      userId,
      seasonCode: 'EASTER',
      currentWeek: 3,
      bookCoverage: {
        'Leviticus': 50,
        'Joel': 30,
        'Nahum': 20,
        'Malachi': 25,
        'Hosea': 40,
        'Amos': 35,  // All books well-covered, may trigger exhaustion
      },
    });
    
    await authAs(context, user.token, userId);
  });
  
  test.afterEach(async ({ request }) => {
    await cleanupTestUser(request, userId);
  });
  
  test('pool exhaustion → modal with conditional CTAs', async ({ page }) => {
    await page.goto('/ranked');
    
    // Trigger exhaustion by playing repeatedly
    await exhaustQuestionPool(page);
    
    // Assert: PoolExhaustedModal shown
    await expect(page.locator('text=Pool Tuần Cạn')).toBeVisible({ timeout: 5000 });
    
    // Assert: 2 CTAs visible (canUnlockNext=true scenario)
    // (Test user completed week 3, so can unlock week 4)
    await expect(
      page.locator('button:has-text("Sang Tuần Kế Tiếp")')
    ).toBeVisible();
    await expect(
      page.locator('button:has-text("Để mai chơi")')
    ).toBeVisible();
    
    // Action: Unlock
    await page.click('button:has-text("Sang Tuần Kế Tiếp")');
    
    // Assert: Modal closes, week advances
    await expect(page.locator('text=Pool Tuần Cạn')).not.toBeVisible();
    await expect(page.locator('text=Tuần 4')).toBeVisible({ timeout: 3000 });
  });
});
```

**Commit message:**
```
test(e2e): W-M07-007 pool exhaustion modal

Verifies PoolExhaustedModal conditional CTAs based on canUnlockNext flag.

Refs: SPEC_USER_v3.2 §7.11.4
```

### Commit 4: W-M07-008 — Badge award flow

**File:** `apps/web/e2e/ranked/badge-award.spec.ts` — TO CREATE

```typescript
import { test, expect } from '@playwright/test';
import { seedTestUser, seedBadge, cleanupTestUser } from '../helpers/seed';
import { authAs } from '../helpers/auth';
import { TEST_USERS } from '../fixtures/test-users';

test.describe('W-M07-008: Badge award flow', () => {
  let userId: string;
  
  test.beforeEach(async ({ request, context }) => {
    const user = await seedTestUser(request, TEST_USERS.TIER_6_VI);
    userId = user.userId;
    
    // Seed unshown badge
    await seedBadge(request, {
      userId,
      seasonCode: 'EASTER',
      badgeTier: 'TOAN_THU',
      unshown: true,
    });
    
    await authAs(context, user.token, userId);
  });
  
  test.afterEach(async ({ request }) => {
    await cleanupTestUser(request, userId);
  });
  
  test('TOAN_THU badge → modal → mark shown', async ({ page }) => {
    await page.goto('/ranked');
    
    // Assert: BadgeAwardModal appears
    await expect(page.locator('text=BẠN ĐÃ ĐẠT ĐƯỢC')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Toàn Thư')).toBeVisible();
    
    // Assert: TOAN_THU visual hierarchy
    const heading = page.locator('text=Toàn Thư');
    await expect(heading).toHaveClass(/badge-tier-toan-thu|toan-thu-heading/);
    
    // Assert: 4-stat grid
    await expect(page.locator('[data-testid="badge-stat"]')).toHaveCount(4);
    
    // Action: Close → triggers mark-shown
    const markShownResponse = page.waitForResponse(
      resp => resp.url().includes('/mark-shown') && resp.status() === 200
    );
    
    await page.click('button:has-text("Đóng")');
    await markShownResponse;
    
    // Assert: Reload → modal does NOT reappear
    await page.reload();
    await expect(page.locator('text=BẠN ĐÃ ĐẠT ĐƯỢC')).not.toBeVisible({ timeout: 3000 });
  });
  
  test('HANH_HUONG badge → simpler visual hierarchy', async ({ request, page }) => {
    // Re-seed with HANH_HUONG tier
    await cleanupTestUser(request, userId);
    const user = await seedTestUser(request, TEST_USERS.TIER_4_VI);
    userId = user.userId;
    
    await seedBadge(request, {
      userId,
      seasonCode: 'EASTER',
      badgeTier: 'HANH_HUONG',
      unshown: true,
    });
    
    await authAs(page.context(), user.token, userId);
    await page.goto('/ranked');
    
    await expect(page.locator('text=Hành Hương')).toBeVisible({ timeout: 3000 });
    
    // Assert: Simpler styling (no gradient text-fill)
    const heading = page.locator('text=Hành Hương');
    await expect(heading).not.toHaveClass(/gradient|cormorant/);
  });
});
```

**Commit message:**
```
test(e2e): W-M07-008 badge award flow

Verifies BadgeAwardModal trigger from coverage-status,
mark-shown API call on close, visual hierarchy per tier.

Refs: SPEC_USER_v3.2 §7.1.8
```

---

## Phase 3: Manual verification

After all 4 commits:

```bash
# Run E2E suite locally
cd apps/web
npx playwright test e2e/ranked/

# Expected output: 3 test files, ~5 tests total, all pass
```

### CI integration

Update `.github/workflows/*.yml` hoặc Jenkins pipeline to include `e2e/ranked/` in test run.

Acceptance:
- [ ] All 3 test files green locally
- [ ] CI passes E2E tests
- [ ] No flakiness across 5 consecutive runs
- [ ] Test execution time < 2 minutes total

---

## Rules cho Claude Code

1. **Verification-first:** Phase 1 audit BEFORE implementation. Critical: confirm BE test endpoints OR plan DB direct seed.

2. **Reuse existing patterns:** Match codebase auth + setup patterns, don't reinvent.

3. **Idempotent tests:** afterEach cleanup mandatory. Tests must pass in any order.

4. **No magic timeouts:** Use Playwright's `waitForX` over `waitForTimeout`. Document any necessary waits.

5. **Selector stability:** Prefer `data-testid` over text-only. Add `data-testid` to FE components if needed (separate commit if so).

6. **Separate commits:** Each test file own commit + helpers commit = 4 total.

7. **No BE changes:** If BE seed endpoints missing → flag in audit, defer to separate BE PROMPT.

8. **Light scope:** ONLY 3 critical tests. Don't expand W-M07 suite — that's v1.1.

---

## Done criteria

- [ ] Phase 1 audit summary delivered
- [ ] 4 commits merged (helpers + 3 test files)
- [ ] All tests green locally
- [ ] CI integration confirmed
- [ ] No flakiness 5 consecutive runs

When done, output:
> "E2E seed infra + 3 critical W-M07 tests shipped. Tests passing locally + CI. Foundation ready for v1.1 W-M07 expansion."

Then STOP — Bui review.

---

## Deferred to v1.1 (after launch + user feedback)

- W-M07-001: New user start Ranked → see week 1 books
- W-M07-003: Skip 2 weeks → return → no debt
- W-M07-004: Mastery week → catchup mode
- W-M07-005: Season transition → reset
- W-M07-006: Pool exhaust fallback chain

Add to BACKLOG: `BL-E2E-COVERAGE-EXPANSION`.
