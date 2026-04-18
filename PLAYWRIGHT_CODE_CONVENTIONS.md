# PLAYWRIGHT_CODE_CONVENTIONS.md
# Quy tắc viết code Playwright từ Manual Test Case Specs

> Tài liệu này là **luật bắt buộc** khi chuyển TC specs (markdown) thành code `.spec.ts`.
> Mọi engineer (hoặc AI) viết Playwright code PHẢI đọc và tuân theo file này.
> Nếu TC spec mâu thuẫn với file này → file này thắng.

---

## 0. Bootstrap — Setup Playwright từ zero

> **ĐỌC SECTION NÀY TRƯỚC.** Nếu project chưa có Playwright → phải setup trước khi viết test.

### Kiểm tra Playwright đã cài chưa

```bash
cd apps/web && npx playwright --version 2>/dev/null || echo "CHƯA CÀI"
```

### Nếu chưa cài → chạy lần lượt:

```bash
# 1. Cài Playwright
cd apps/web && npm install -D @playwright/test

# 2. Cài browser (chỉ Chromium cho nhẹ)
cd apps/web && npx playwright install chromium

# 3. Tạo config file
# → Xem nội dung mẫu ở section "Playwright Config Template" bên dưới

# 4. Tạo folder structure
mkdir -p tests/e2e/{fixtures,pages,helpers,specs}
mkdir -p tests/e2e/fixtures/storage-states

# 5. Verify
cd apps/web && npx playwright test --list
```

### Playwright Config Template

Tạo file `apps/web/playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 1,
  reporter: [['html', { open: 'never' }]],
  timeout: 30_000,

  expect: { timeout: 5_000 },

  use: {
    baseURL: 'http://localhost:5173',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Cần app đang chạy trước khi test
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
```

### Thêm scripts vào package.json

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report"
  }
}
```

### Sau khi setup xong → tiếp tục đọc các sections bên dưới để viết test.

---

## Mục lục

1. Project Structure
2. File Naming & Organization
3. Test Anatomy — Required Sections
4. Auth Patterns
5. Test Data & Fixtures
6. Selector Strategy
7. Assertions — Mandatory Patterns
8. API Verification (L2+)
9. Wait Strategy — No Magic Numbers
10. Error Handling & Debugging
11. Tags & Annotations
12. Isolation & Cleanup
13. Flakiness Prevention
14. Page Object Model (POM)
15. Checklist — Definition of Done cho 1 test file
16. Anti-Patterns — KHÔNG BAO GIỜ làm
17. Ví dụ hoàn chỉnh

---

## 1. Project Structure

> **Tất cả e2e test nằm trong `apps/web/tests/e2e/`.**
> Config Playwright ở `apps/web/playwright.config.ts` (testDir = `./tests/e2e`).
> KHÔNG đặt test trong `src/` — đó là cho Vitest unit tests.

```
apps/web/
├── playwright.config.ts              # Config chính (xem section 0 Bootstrap)
├── tests/e2e/                        # testDir — Playwright đọc từ đây
│   ├── fixtures/
│   │   ├── auth.ts                   # Custom fixtures (authenticated pages)
│   │   ├── api.ts                    # API helper fixture
│   │   └── storage-states/           # Generated bởi global-setup
│   │       ├── tier1.json
│   │       ├── tier2.json
│   │       ├── ...
│   │       └── admin.json
│   ├── pages/                        # Page Object Models
│   │   ├── BasePage.ts               # Shared methods
│   │   ├── LoginPage.ts
│   │   ├── HomePage.ts
│   │   ├── PracticePage.ts
│   │   ├── RankedPage.ts
│   │   ├── QuizPage.ts
│   │   ├── QuizResultsPage.ts
│   │   ├── DailyChallengePage.ts
│   │   └── admin/
│   │       ├── AdminDashboardPage.ts
│   │       ├── AdminQuestionsPage.ts
│   │       └── ...
│   ├── helpers/
│   │   ├── test-api.ts               # Typed wrapper cho AdminTestController
│   │   ├── seed.ts                   # TestDataSeeder wrapper
│   │   └── assertions.ts             # Custom assertion helpers
│   ├── global-setup.ts               # Seed data + tạo storageState files
│   ├── global-teardown.ts            # Cleanup seed data
│   ├── smoke/                        # L1 — smoke tests
│   │   ├── web-user/
│   │   │   ├── W-M01-auth.spec.ts
│   │   │   ├── W-M02-home.spec.ts
│   │   │   └── ...
│   │   └── web-admin/
│   │       ├── A-M01-dashboard.spec.ts
│   │       └── ...
│   └── happy-path/                   # L2 — happy path tests
│       ├── web-user/
│       │   ├── W-M04-ranked.spec.ts
│       │   └── ...
│       └── web-admin/
│           └── ...
```

---

## 2. File Naming & Organization

### File names

```
{SCOPE}-{MODULE_ID}-{module-name}.spec.ts
```

Ví dụ:
- `W-M01-auth.spec.ts`
- `W-M04-ranked.spec.ts`
- `A-M03-questions.spec.ts`

### Test names — map 1:1 với TC spec ID

TC spec: `W-M04-L2-003 — Trả lời 5/5 đúng → score đúng công thức`
Code:
```typescript
test('W-M04-L2-003: Trả lời 5/5 đúng → score đúng công thức', async ({ page }) => {
```

**Bắt buộc**: test name bắt đầu bằng TC ID. Khi test fail, nhìn ID → tra spec → biết context ngay.

### Grouping bằng `test.describe`

```typescript
// W-M04-ranked.spec.ts
test.describe('W-M04 Ranked Mode — L2 Happy Path', () => {
  test.describe('Scoring & XP', () => {
    test('W-M04-L2-001: Base points theo difficulty', ...);
    test('W-M04-L2-002: Speed bonus formula', ...);
    test('W-M04-L2-003: Combo multiplier ×1.2 sau 5 câu đúng', ...);
  });

  test.describe('Energy System', () => {
    test('W-M04-L2-005: Sai trừ 5 energy', ...);
    test('W-M04-L2-006: Energy = 0 → disable ranked', ...);
  });
});
```

---

## 3. Test Anatomy — Required Sections

Mỗi test PHẢI có đủ 4 sections, theo đúng thứ tự:

```typescript
test('W-M04-L2-003: Trả lời 5/5 đúng → score đúng công thức', async ({
  authenticatedPage,  // custom fixture, đã login
  testApi,            // API helper fixture
}) => {
  // ============================================================
  // SECTION 1: SETUP — State manipulation qua API
  // Map từ TC spec section "Setup"
  // ============================================================
  await testApi.setState('test3@dev.local', {
    livesRemaining: 100,
    questionsCounted: 0,
  });

  // ============================================================
  // SECTION 2: ACTIONS — User interactions
  // Map từ TC spec section "Actions" — 1 step = 1 line
  // ============================================================
  const page = authenticatedPage;
  const rankedPage = new RankedPage(page);

  await rankedPage.goto();
  await rankedPage.startQuiz();

  // Answer 5 questions correctly
  const quizPage = new QuizPage(page);
  for (let i = 0; i < 5; i++) {
    await quizPage.answerCorrectly(); // POM method
  }

  // ============================================================
  // SECTION 3: UI ASSERTIONS — Verify UI state
  // Map từ TC spec section "Assertions"
  // ============================================================
  const resultsPage = new QuizResultsPage(page);
  await expect(resultsPage.scoreDisplay).toHaveText(/\d+/);
  await expect(resultsPage.accuracyDisplay).toHaveText('100%');
  await expect(resultsPage.gradeText).toHaveText('Xuất sắc!');

  // ============================================================
  // SECTION 4: API VERIFICATION — Verify backend state (L2 bắt buộc)
  // Map từ TC spec section "API Verification"
  // ============================================================
  const user = await testApi.getMe('test3@dev.local');
  expect(user.totalPoints).toBeGreaterThan(0);
  expect(user.streak).toBe(1);
});
```

### Section rules

| Section | L1 Smoke | L2 Happy Path | L3 Edge |
|---------|----------|---------------|---------|
| Setup | Optional | Bắt buộc | Bắt buộc |
| Actions | Bắt buộc | Bắt buộc | Bắt buộc |
| UI Assertions | Bắt buộc | Bắt buộc | Bắt buộc |
| API Verification | Không cần | Bắt buộc cho `@write` | Bắt buộc |

---

## 4. Auth Patterns

### Pattern A — storageState (read-only tests)

```typescript
// fixtures/auth.ts
import { test as base } from '@playwright/test';

type AuthFixtures = {
  tier1Page: Page;
  tier3Page: Page;
  tier6Page: Page;
  adminPage: Page;
};

export const test = base.extend<AuthFixtures>({
  tier3Page: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: 'tests/e2e/playwright/fixtures/storage-states/tier3.json',
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
  // ... similar cho tier1, tier6, admin
});
```

Dùng khi: TC spec ghi `Auth: storageState=tier3`

```typescript
test('W-M02-L1-001: Home hiển thị đúng tier', async ({ tier3Page }) => {
  await tier3Page.goto('/home');
  await expect(tier3Page.getByTestId('tier-badge')).toHaveText('Ngọn Đèn');
});
```

### Pattern B — Fresh login (write tests)

```typescript
test('W-M01-L2-001: Login email/password', async ({ page, testApi }) => {
  // Fresh login — không dùng storageState
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginWithCredentials('test3@dev.local', 'Test@123456');
  await expect(page).toHaveURL('/home');
});
```

Dùng khi: TC spec ghi `Auth: fresh login as test3@dev.local`

### Pattern C — Guest (no auth)

```typescript
test('W-M01-L1-005: Guest xem daily challenge', async ({ page }) => {
  // Không login, không storageState
  await page.goto('/daily');
  await expect(page.getByTestId('daily-challenge-card')).toBeVisible();
});
```

Dùng khi: TC spec ghi `Auth: không login (guest)`

### Quy tắc chọn auth pattern

| TC spec ghi | Dùng pattern | Lý do |
|-------------|-------------|-------|
| `storageState=tierN` | Pattern A | Nhanh, reuse context |
| `fresh login as xxx` | Pattern B | Test cần fresh session |
| `không login (guest)` | Pattern C | Test guest flow |
| Không ghi gì | **HỎI** — không đoán | Thiếu spec |

---

## 5. Test Data & Fixtures

### Global setup — seed 1 lần

```typescript
// global-setup.ts
import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const apiUrl = config.projects[0].use.baseURL!.replace(':5173', ':8080');

  // 1. Seed test data
  await fetch(`${apiUrl}/api/admin/seed/test-data`, { method: 'POST' });

  // 2. Login cho mỗi tier → save storageState
  for (let tier = 1; tier <= 6; tier++) {
    const response = await fetch(`${apiUrl}/api/auth/mobile/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test${tier}@dev.local`,
        password: 'Test@123456',
      }),
    });
    const { accessToken, refreshToken } = await response.json();

    // Save storageState
    // ... (Playwright browser context login + saveStorageState)
  }

  // 3. Admin storageState
  // ... login admin user, save
}

export default globalSetup;
```

### Per-test setup — AdminTestController wrapper

```typescript
// helpers/test-api.ts
export class TestApi {
  constructor(private baseUrl: string = 'http://localhost:8080') {}

  async setState(email: string, state: Partial<SetStateRequest>): Promise<void> {
    const userId = await this.getUserIdByEmail(email);
    const response = await fetch(
      `${this.baseUrl}/api/admin/test/users/${userId}/set-state`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.adminToken}`,
        },
        body: JSON.stringify(state),
      }
    );
    if (!response.ok) throw new Error(`set-state failed: ${response.status}`);
  }

  async getMe(email: string): Promise<UserProfile> {
    // Login as user → GET /api/me → return typed response
  }

  async setTier(email: string, tierLevel: number): Promise<void> {
    const userId = await this.getUserIdByEmail(email);
    await fetch(
      `${this.baseUrl}/api/admin/test/users/${userId}/set-tier?tierLevel=${tierLevel}`,
      { method: 'POST', headers: { 'Authorization': `Bearer ${this.adminToken}` } }
    );
  }

  async resetHistory(email: string): Promise<void> { /* ... */ }
  async refillEnergy(email: string): Promise<void> { /* ... */ }
  async fullReset(email: string): Promise<void> { /* ... */ }
}
```

### Dùng TestApi làm fixture

```typescript
// fixtures/api.ts
import { test as base } from '@playwright/test';
import { TestApi } from '../helpers/test-api';

export const test = base.extend<{ testApi: TestApi }>({
  testApi: async ({}, use) => {
    const api = new TestApi();
    await api.init(); // login admin, cache token
    await use(api);
  },
});
```

### Quy tắc test data

| Rule | Giải thích |
|------|-----------|
| KHÔNG hardcode userId | Dùng `testApi.getUserIdByEmail()` hoặc fixture |
| KHÔNG assume data từ test trước | Mỗi test có `beforeEach` setup riêng |
| KHÔNG seed data bằng SQL trực tiếp | Chỉ dùng API (TestDataSeeder + AdminTestController) |
| KHÔNG tạo data permanent | Test data sẽ bị xóa bởi global-teardown |
| Dùng test users theo tier | `test1@dev.local` = tier 1, ..., `test6@dev.local` = tier 6 |

---

## 6. Selector Strategy

### Priority (từ cao đến thấp)

```typescript
// 1. data-testid (BEST — stable, explicit, không đụng khi refactor UI)
page.getByTestId('ranked-start-btn')

// 2. ARIA role + accessible name (semantic, tốt cho accessibility)
page.getByRole('button', { name: 'Bắt đầu' })
page.getByRole('heading', { name: 'Xếp hạng' })

// 3. Text content (chỉ cho text tĩnh, dễ gãy khi đổi copy)
page.getByText('Xuất sắc!')

// 4. Label (cho form inputs)
page.getByLabel('Email')

// 5. Placeholder (cho inputs không có label)
page.getByPlaceholder('Nhập email')

// 6. CSS selector (LAST RESORT — fragile, đụng khi refactor class/structure)
page.locator('.glass-card >> button.gold-gradient')
```

### data-testid naming convention

Format: `{page}-{element}[-{variant}]`

```
home-tier-badge
home-daily-verse
home-leaderboard-tab-daily
home-leaderboard-tab-weekly
ranked-start-btn
ranked-energy-bar
ranked-energy-count
ranked-daily-progress
quiz-timer
quiz-question-text
quiz-option-0
quiz-option-1
quiz-option-2
quiz-option-3
quiz-combo-banner
quiz-results-score
quiz-results-accuracy
quiz-results-grade
admin-users-search-input
admin-users-table-row-{userId}
```

### Quy tắc selectors

| Rule | Ví dụ |
|------|-------|
| KHÔNG dùng index nếu có thể dùng ID | `quiz-option-0` ok (fixed 4 options), nhưng `users-row-0` ❌ → `users-row-{id}` ✅ |
| KHÔNG dùng class CSS | `.btn-primary` ❌ (refactor CSS sẽ break) |
| KHÔNG dùng tag name | `div > span` ❌ |
| KHÔNG chain quá 3 levels | `page.locator('.a .b .c .d')` ❌ |
| text selector phải exact khi có thể | `{ exact: true }` nếu text unique |

### Khi element chưa có testid

TC spec đánh dấu `[NEEDS TESTID: suggested-name]`. Khi viết code:

```typescript
// TODO [NEEDS TESTID: ranked-energy-count]
// Tạm dùng fallback selector — sẽ đổi khi testid được thêm vào source
await expect(page.getByRole('heading', { name: /Energy/ })).toBeVisible();
```

**Bắt buộc**: comment TODO với suggested testid name. Khi source code thêm testid → global find-replace TODO comment → đổi sang `getByTestId()`.

---

## 7. Assertions — Mandatory Patterns

### Mỗi test PHẢI có ít nhất 1 assertion. 0 assertion = test vô nghĩa.

### UI Assertions — patterns chuẩn

```typescript
// Visibility
await expect(page.getByTestId('tier-badge')).toBeVisible();
await expect(page.getByTestId('locked-mode-card')).not.toBeVisible();

// Text content — dùng exact khi biết giá trị chính xác
await expect(page.getByTestId('tier-badge')).toHaveText('Ngọn Đèn');

// Text content — dùng regex khi giá trị dynamic
await expect(page.getByTestId('score')).toHaveText(/^\d+ điểm$/);

// URL
await expect(page).toHaveURL('/home');
await expect(page).toHaveURL(/\/quiz\/results\/\w+/);

// Count
await expect(page.getByTestId('leaderboard-row')).toHaveCount(10);

// Attribute
await expect(page.getByTestId('ranked-start-btn')).toBeEnabled();
await expect(page.getByTestId('ranked-start-btn')).toBeDisabled();

// CSS class (chỉ khi check state visual)
await expect(page.getByTestId('answer-btn-2')).toHaveClass(/correct/);

// localStorage (chỉ cho auth tests)
const token = await page.evaluate(() => localStorage.getItem('accessToken'));
expect(token).toBeTruthy();
```

### KHÔNG BAO GIỜ assert

```typescript
// ❌ Assert style/color — fragile, meaningless
await expect(el).toHaveCSS('color', 'rgb(34, 197, 94)');

// ❌ Assert screenshot pixel — quá fragile, maintenance hell
await expect(page).toHaveScreenshot();

// ❌ Assert timing — flaky
expect(Date.now() - start).toBeLessThan(2000);

// ❌ Assert console.log — implementation detail
page.on('console', msg => expect(msg.text()).toContain('loaded'));
```

---

## 8. API Verification (L2+ bắt buộc)

### Khi nào dùng

| Tag test | API Verification |
|----------|-----------------|
| `@smoke` (L1) | Không cần |
| `@write` (L2) | **BẮT BUỘC** |
| `@parallel-safe` (read-only) | Không cần |

### Pattern

```typescript
// SECTION 4: API VERIFICATION
// Map từ TC spec section "API Verification"

// Login as test user → gọi API → check response
const userBefore = await testApi.getMe('test3@dev.local');

// ... (section 2 actions ở trên)

const userAfter = await testApi.getMe('test3@dev.local');

// Assert delta chính xác
expect(userAfter.totalPoints - userBefore.totalPoints).toBe(expectedDelta);
expect(userAfter.streak).toBe(userBefore.streak + 1);

// Assert mission progress
const missions = await testApi.getMissions('test3@dev.local');
expect(missions.find(m => m.type === 'ANSWER_5_CORRECT')?.completed).toBe(true);
```

### API Verification helper methods (TestApi)

```typescript
// Các methods TestApi CẦN CÓ cho L2:
testApi.getMe(email)            → UserProfile (totalPoints, streak, tier, energy...)
testApi.getMissions(email)      → DailyMission[]
testApi.getJourney(email)       → JourneyProgress (66 books)
testApi.getHistory(email)       → QuizSession[] (recent)
testApi.getRankedStatus(email)  → { livesRemaining, questionsCounted, ... }
testApi.getWeaknesses(email)    → { weakBooks, strongBooks }
```

### Quy tắc API Verification

| Rule | Giải thích |
|------|-----------|
| Snapshot "before" TRƯỚC actions | `userBefore = await testApi.getMe()` ở đầu test |
| Assert **delta** không phải **absolute** | `after - before == N` thay vì `after == 42` (absolute fragile khi data thay đổi) |
| Không verify internal DB state | Chỉ qua public API. KHÔNG query DB trực tiếp |
| Retry nếu eventual consistency | `await expect.poll(() => testApi.getMe(email)).toMatchObject(...)` |

---

## 9. Wait Strategy — No Magic Numbers

### KHÔNG BAO GIỜ dùng `page.waitForTimeout()`

```typescript
// ❌ TUYỆT ĐỐI KHÔNG
await page.waitForTimeout(2000);
await page.waitForTimeout(500);

// ✅ Wait cho element
await page.getByTestId('quiz-results-score').waitFor({ state: 'visible' });

// ✅ Wait cho URL
await page.waitForURL('/home');
await page.waitForURL(/\/quiz\/results\//);

// ✅ Wait cho network idle (sau navigation)
await page.goto('/ranked', { waitUntil: 'networkidle' });

// ✅ Wait cho API response
await page.waitForResponse(resp =>
  resp.url().includes('/api/sessions') && resp.status() === 200
);

// ✅ Poll-based wait cho async state
await expect.poll(async () => {
  const user = await testApi.getMe('test3@dev.local');
  return user.totalPoints;
}, { timeout: 5000 }).toBeGreaterThan(0);
```

### Timeout defaults

```typescript
// playwright.config.ts
{
  timeout: 30_000,        // per test
  expect: { timeout: 5_000 }, // per assertion
  use: {
    actionTimeout: 10_000,  // per action (click, fill...)
    navigationTimeout: 15_000,
  },
}
```

Nếu test cần timeout dài hơn (ví dụ quiz 10 câu): set per-test, KHÔNG đổi global.

```typescript
test.slow(); // 3× default timeout cho test này
```

---

## 10. Error Handling & Debugging

### Screenshot on failure (tự động)

```typescript
// playwright.config.ts
{
  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
}
```

### Console error monitoring

```typescript
// fixtures/auth.ts — thêm vào mọi test
page.on('pageerror', error => {
  console.error(`[Browser Error] ${error.message}`);
});

// Optional: fail test nếu có JS error không mong đợi
const errors: string[] = [];
page.on('pageerror', error => errors.push(error.message));
// ... test actions ...
expect(errors.filter(e => !e.includes('expected-known-error'))).toHaveLength(0);
```

### Network failure monitoring

```typescript
page.on('response', response => {
  if (response.status() >= 500) {
    console.error(`[API 5xx] ${response.url()} → ${response.status()}`);
  }
});
```

---

## 11. Tags & Annotations

### Tags — dùng trong test name hoặc describe

```typescript
// Tag bằng Playwright tag syntax
test('W-M04-L2-003: Score formula @smoke @critical', ...);

// Hoặc dùng test.describe với tag
test.describe('W-M04 Ranked @write @serial', () => { ... });
```

### Standard tags

| Tag | Meaning | Playwright filter |
|-----|---------|-------------------|
| `@smoke` | L1 smoke test | `--grep @smoke` |
| `@happy` | L2 happy path | `--grep @happy` |
| `@critical` | P0 — release blocker | `--grep @critical` |
| `@write` | Có mutation, cần API verification | `--grep @write` |
| `@serial` | Không chạy parallel | Configure trong `playwright.config.ts` |
| `@parallel-safe` | Chỉ read, chạy parallel ok | Default |
| `@admin` | Admin panel test | `--grep @admin` |
| `@deferred-ws` | WebSocket gameplay, skip | `--grep-invert @deferred-ws` |
| `@dev-only` | Chỉ chạy ở dev env | Conditional trong CI |
| `@needs-testid` | Dùng fallback selector | Tracking purpose |

### Run filters

```bash
# Chỉ chạy smoke
npx playwright test --grep @smoke

# Chỉ chạy critical
npx playwright test --grep @critical

# Bỏ qua deferred
npx playwright test --grep-invert @deferred-ws

# Chỉ admin
npx playwright test --grep @admin

# Combo: smoke + critical, không deferred
npx playwright test --grep "(?=.*@smoke)(?=.*@critical)" --grep-invert @deferred-ws
```

---

## 12. Isolation & Cleanup

### beforeEach — bắt buộc cho `@write`

```typescript
test.describe('W-M04 Ranked @write @serial', () => {
  test.beforeEach(async ({ testApi }) => {
    // Reset state về known state trước MỖI test
    await testApi.setState('test3@dev.local', {
      livesRemaining: 100,
      questionsCounted: 0,
    });
  });

  test('W-M04-L2-005: Sai trừ 5 energy', async ({ tier3Page, testApi }) => {
    // Test body — state đã clean
  });
});
```

### afterEach — optional, dùng khi test tạo side effects khó revert

```typescript
test.afterEach(async ({ testApi }) => {
  // Chỉ dùng khi test tạo data persistent (ví dụ create group)
  // Nếu chỉ modify user state → beforeEach next test sẽ reset
  await testApi.fullReset('test3@dev.local');
});
```

### Parallel vs Serial

```typescript
// playwright.config.ts
{
  // File-level parallel: mỗi file chạy parallel, tests TRONG file chạy serial
  fullyParallel: false,
  workers: process.env.CI ? 4 : 1,

  projects: [
    {
      name: 'smoke-parallel',
      testMatch: /smoke\/.*\.spec\.ts/,
      fullyParallel: true,  // L1 smoke hầu hết parallel-safe
    },
    {
      name: 'happy-path-serial',
      testMatch: /happy-path\/.*\.spec\.ts/,
      fullyParallel: false,  // L2 default serial
    },
  ],
}
```

### Quy tắc isolation

| Rule | Giải thích |
|------|-----------|
| KHÔNG bao giờ assume state từ test trước | Mỗi test self-contained |
| `@write` tests PHẢI có `beforeEach` setup | Không negotiable |
| `@parallel-safe` tests KHÔNG modify shared state | Chỉ read hoặc tạo ephemeral data |
| 1 test file = 1 module | Không mix M04 và M10 trong cùng file |
| Mỗi test dùng 1 test user cố định | `test3@dev.local` cho tier 3 tests |

---

## 13. Flakiness Prevention

### Top 5 nguyên nhân flaky + cách phòng

| # | Nguyên nhân | Phòng tránh |
|---|------------|-------------|
| 1 | Race condition: element chưa render | Dùng `waitFor()` hoặc `expect().toBeVisible()` — KHÔNG `waitForTimeout()` |
| 2 | Test phụ thuộc thứ tự | `beforeEach` reset state. Không share state giữa tests |
| 3 | Animation chưa xong | `page.getByTestId('x').waitFor({ state: 'visible' })` sau animation |
| 4 | Network chậm | `page.waitForResponse()` cho API calls quan trọng |
| 5 | Timezone | Tất cả date logic dùng UTC. CI server set `TZ=UTC` |

### Retry strategy

```typescript
// playwright.config.ts
{
  retries: process.env.CI ? 2 : 0,  // Retry 2 lần trong CI, 0 ở local
}
```

**Rule**: nếu 1 test fail > 3/10 lần → FIX test, không tăng retry.

### Các tiện ích chống flaky

```typescript
// Helper: wait cho animation xong
async function waitForAnimationEnd(locator: Locator) {
  await locator.evaluate(el =>
    new Promise(resolve => {
      el.addEventListener('animationend', resolve, { once: true });
      el.addEventListener('transitionend', resolve, { once: true });
      // Fallback timeout nếu không có animation
      setTimeout(resolve, 1000);
    })
  );
}

// Helper: wait cho loading skeleton biến mất
async function waitForLoaded(page: Page) {
  await expect(page.locator('[class*="skeleton"]')).toHaveCount(0, { timeout: 10000 });
}
```

---

## 14. Page Object Model (POM)

### Mỗi page/route chính CẦN 1 POM

```typescript
// pages/RankedPage.ts
import { type Page, type Locator, expect } from '@playwright/test';

export class RankedPage {
  // Locators — khai báo 1 lần, reuse
  readonly startBtn: Locator;
  readonly energyBar: Locator;
  readonly energyCount: Locator;
  readonly dailyProgress: Locator;
  readonly seasonInfo: Locator;

  constructor(private page: Page) {
    this.startBtn = page.getByTestId('ranked-start-btn');
    this.energyBar = page.getByTestId('ranked-energy-bar');
    this.energyCount = page.getByTestId('ranked-energy-count');
    this.dailyProgress = page.getByTestId('ranked-daily-progress');
    this.seasonInfo = page.getByTestId('ranked-season-info');
  }

  async goto() {
    await this.page.goto('/ranked');
    await this.page.waitForLoadState('networkidle');
  }

  async startQuiz() {
    await this.startBtn.click();
    await this.page.waitForURL(/\/quiz\//);
  }

  // Assertions helpers (self-documenting)
  async expectEnergyToBe(value: number) {
    await expect(this.energyCount).toHaveText(`${value}`);
  }

  async expectStartDisabled() {
    await expect(this.startBtn).toBeDisabled();
  }
}
```

### POM rules

| Rule | Giải thích |
|------|-----------|
| POM chỉ chứa locators + actions + assertion helpers | KHÔNG chứa test logic |
| 1 POM = 1 page/route | `RankedPage`, `QuizPage`, `AdminUsersPage` |
| Shared components = shared POM | `TierBadge`, `EnergyBar` → extract riêng nếu dùng >2 pages |
| POM methods return `Promise<void>` | Không return data — test tự assert |
| POM KHÔNG gọi API | API calls thuộc `TestApi`, không thuộc POM |

### QuizPage — POM phức tạp nhất

```typescript
// pages/QuizPage.ts
export class QuizPage {
  readonly timer: Locator;
  readonly questionText: Locator;
  readonly options: Locator;      // 4 option buttons
  readonly comboCounter: Locator;
  readonly progressBar: Locator;

  constructor(private page: Page) {
    this.timer = page.getByTestId('quiz-timer');
    this.questionText = page.getByTestId('quiz-question-text');
    this.options = page.getByTestId(/^quiz-option-/);
    this.comboCounter = page.getByTestId('quiz-combo-banner');
    this.progressBar = page.getByTestId('quiz-progress-bar');
  }

  // Answer câu hỏi — cần biết đáp án đúng
  async answerCorrectly() {
    // Strategy: intercept API response để biết đáp án đúng
    const responsePromise = this.page.waitForResponse(
      resp => resp.url().includes('/api/sessions/') && resp.request().method() === 'POST'
    );

    // Click option đầu tiên (sẽ verify qua response)
    // HOẶC: dùng data attribute `data-correct="true"` nếu có trong dev mode
    await this.options.first().click();

    const response = await responsePromise;
    const body = await response.json();

    if (!body.isCorrect) {
      // Nếu sai → cần strategy khác (retry, hoặc dùng cheat endpoint)
      // Recommend: dùng AdminTestController endpoint set known questions
      throw new Error('answerCorrectly() — answer was wrong. Need deterministic question set.');
    }
  }

  // Answer sai (cố ý)
  async answerIncorrectly() {
    // Similar logic, chọn option KHÔNG phải correct
  }

  // Chờ câu tiếp theo load
  async waitForNextQuestion() {
    await this.questionText.waitFor({ state: 'visible' });
  }
}
```

---

## 15. Checklist — Definition of Done cho 1 test file

Trước khi commit 1 file `.spec.ts`, verify:

```
□ File name đúng convention: {SCOPE}-{MODULE}-{name}.spec.ts
□ Mỗi test name bắt đầu bằng TC ID: 'W-M04-L2-003: ...'
□ Mỗi test có 4 sections: Setup / Actions / UI Assertions / API Verification
□ API Verification present cho mọi @write test
□ Không có page.waitForTimeout() (grep kiểm tra)
□ Không có hardcoded userId (grep kiểm tra)
□ Không có CSS selector trừ khi có comment giải thích + TODO NEEDS TESTID
□ beforeEach có set-state cho @write tests
□ Test chạy pass ĐỘC LẬP (chạy riêng file, không cần file khác chạy trước)
□ Test chạy pass 3 LẦN LIÊN TIẾP (không flaky)
□ POM đã tạo/update cho page liên quan
□ Không có console.error unexpected (check pageerror listener)
□ Cleanup: tất cả browser context đã close (no memory leak)
□ Comment TODO cho mọi [NEEDS TESTID] fallback selectors
```

---

## 16. Anti-Patterns — KHÔNG BAO GIỜ làm

```typescript
// ❌ 1. Magic sleep
await page.waitForTimeout(3000);

// ❌ 2. Depend test order
test('A: create', ...);  // creates group
test('B: verify', ...);  // assumes group exists from test A

// ❌ 3. Assert style/CSS values
await expect(el).toHaveCSS('background-color', 'rgb(255, 0, 0)');

// ❌ 4. Hardcode IDs
await page.goto('/admin/users/550e8400-e29b-41d4-a716-446655440000');

// ❌ 5. Skip assertion
test('render test', async ({ page }) => {
  await page.goto('/home');
  // Không assert gì cả → test vô nghĩa
});

// ❌ 6. Catch errors silently
try {
  await page.click('#btn');
} catch {
  // Nuốt error → test luôn pass
}

// ❌ 7. Assert inner HTML
await expect(el).toHaveAttribute('innerHTML', '<span>text</span>');

// ❌ 8. Query DB trực tiếp
import mysql from 'mysql2';
const [rows] = await pool.execute('SELECT * FROM users WHERE ...');

// ❌ 9. Test implementation details
await expect(page.locator('div.MuiButton-root')).toBeVisible();

// ❌ 10. Shared mutable state giữa tests
let sharedUserId: string;
test('A', async () => { sharedUserId = '...'; });
test('B', async () => { /* dùng sharedUserId */ });
```

---

## 17. Ví dụ hoàn chỉnh

### TC Spec (input)

```markdown
### W-M04-L2-006 — Energy = 0 → disable ranked, cho phép Practice

**Priority**: P0
**Auth**: storageState=tier3
**Tags**: @happy @write @serial @critical
**Setup**:
- POST /api/admin/test/users/{test3Id}/set-state { "livesRemaining": 0 }

**Actions**:
1. goto /ranked
2. Verify start button disabled
3. Verify energy count = "0"
4. Verify banner "Hết năng lượng"
5. Click "Luyện tập" link
6. Verify redirect to /practice
7. Verify Practice start button enabled

**Assertions**:
- [data-testid=ranked-start-btn] is disabled
- [data-testid=ranked-energy-count] text "0"
- [data-testid=ranked-energy-banner] visible, text contains "Hết năng lượng"
- URL = /practice
- [data-testid=practice-start-btn] is enabled

**API Verification**:
- GET /api/me/ranked-status → livesRemaining = 0
```

### Code Playwright (output)

```typescript
// tests/e2e/happy-path/web-user/W-M04-ranked.spec.ts

import { test, expect } from '../../fixtures/auth';
import { RankedPage } from '../../pages/RankedPage';
import { PracticePage } from '../../pages/PracticePage';

test.describe('W-M04 Ranked Mode — L2 Happy Path @write @serial', () => {

  test.describe('Energy System', () => {

    test('W-M04-L2-006: Energy = 0 → disable ranked, cho phép Practice @critical', async ({
      tier3Page,
      testApi,
    }) => {
      // ============================================================
      // SECTION 1: SETUP
      // ============================================================
      await testApi.setState('test3@dev.local', {
        livesRemaining: 0,
      });

      // ============================================================
      // SECTION 2: ACTIONS
      // ============================================================
      const page = tier3Page;
      const rankedPage = new RankedPage(page);

      await rankedPage.goto();

      // ============================================================
      // SECTION 3: UI ASSERTIONS
      // ============================================================
      await rankedPage.expectStartDisabled();
      await expect(rankedPage.energyCount).toHaveText('0');
      await expect(rankedPage.energyBanner).toBeVisible();
      await expect(rankedPage.energyBanner).toContainText('Hết năng lượng');

      // Navigate to Practice
      await page.getByRole('link', { name: /Luyện tập/i }).click();
      await expect(page).toHaveURL('/practice');

      const practicePage = new PracticePage(page);
      await expect(practicePage.startBtn).toBeEnabled();

      // ============================================================
      // SECTION 4: API VERIFICATION
      // ============================================================
      const rankedStatus = await testApi.getRankedStatus('test3@dev.local');
      expect(rankedStatus.livesRemaining).toBe(0);
    });

  });

});
```

---

## Appendix: Quick Reference Card

```
╔══════════════════════════════════════════════════════════╗
║  PLAYWRIGHT CODE CONVENTIONS — QUICK REFERENCE          ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  File: {SCOPE}-{MODULE}-{name}.spec.ts                  ║
║  Test: 'TC-ID: Mô tả @tags'                            ║
║                                                          ║
║  4 SECTIONS: Setup → Actions → UI Assert → API Verify   ║
║                                                          ║
║  SELECTORS: testid > role > text > css                  ║
║  WAITS: waitFor/waitForURL/waitForResponse              ║
║  NEVER: waitForTimeout, hardcode ID, CSS assert         ║
║                                                          ║
║  AUTH: storageState (read) / fresh login (write)        ║
║  DATA: TestApi.setState() / global seed                 ║
║  ISOLATION: beforeEach reset / 1 user per tier          ║
║                                                          ║
║  L2 MUST: API Verification for @write tests             ║
║  FLAKY: 3× pass rule. Fix test, don't increase retry.  ║
║                                                          ║
║  DOD: grep "waitForTimeout" = 0                         ║
║       grep "hardcoded-uuid" = 0                         ║
║       3× consecutive pass = green                       ║
╚══════════════════════════════════════════════════════════╝
```
