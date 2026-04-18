# Prompt: Chuyển TC Specs thành Playwright Code

Copy toàn bộ phần PROMPT bên dưới paste vào Claude Code:

---

## PROMPT

Chuyển toàn bộ TC specs (markdown) trong `tests/e2e/playwright/specs/` thành code Playwright `.spec.ts`. Playwright CHƯA CÀI trong project — cần bootstrap trước rồi mới viết test.

**Đọc TODO.md trước. Nếu có task dở thì hoàn thành trước.**

---

### BƯỚC 0 — ĐỌC BẮT BUỘC (KHÔNG SKIP)

Đọc KỸ 3 file này TRƯỚC KHI viết bất kỳ dòng code nào:

1. `PLAYWRIGHT_CODE_CONVENTIONS.md` — **Section 0 (Bootstrap)** + toàn bộ 17 sections (test anatomy, auth patterns, POM, selectors, anti-patterns...)
2. `tests/e2e/CONVENTIONS.md` — data-testid policy, test users, auth strategy, isolation, cleanup
3. `tests/e2e/INDEX.md` — master tracking, biết TC nào đã viết, stats

**Ghi nhớ các rules quan trọng:**
- 4-section test anatomy: Setup → Actions → UI Assertions → API Verification
- Test name BẮT ĐẦU bằng TC ID: `'W-M01-L1-001: Trang Login render đúng cho guest'`
- Selector priority: `getByTestId` > `getByRole` > `getByText` > CSS
- KHÔNG BAO GIỜ dùng `page.waitForTimeout()`
- `@write` tests PHẢI có `beforeEach` reset state + API Verification section
- POM cho mỗi page/route chính
- KHÔNG hardcode userId — dùng TestApi helper

---

### BƯỚC 1 — BOOTSTRAP PLAYWRIGHT

**Chỉ làm nếu Playwright chưa cài** (kiểm tra: `cd apps/web && npx playwright --version`).

Follow chính xác PLAYWRIGHT_CODE_CONVENTIONS.md section 0:

```
Task B-1: Cài Playwright + Chromium
- cd apps/web && npm install -D @playwright/test
- cd apps/web && npx playwright install chromium
- Tạo playwright.config.ts theo template trong section 0
- Thêm scripts vào package.json: test:e2e, test:e2e:headed, test:e2e:report
- Verify: npx playwright test --list (phải không lỗi)
- Commit: "chore: bootstrap Playwright e2e framework"

Task B-2: Tạo folder structure
- mkdir -p tests/e2e/{fixtures,pages,helpers}
- mkdir -p tests/e2e/fixtures/storage-states
- mkdir -p tests/e2e/{smoke,happy-path}/{web-user,web-admin}
- Di chuyển specs/ từ tests/e2e/playwright/specs/ sang tests/e2e/specs/ (giữ nguyên nội dung)
- Commit: "chore: create e2e directory structure"

Task B-3: Tạo infrastructure files
- tests/e2e/helpers/test-api.ts — TestApi class (xem PLAYWRIGHT_CODE_CONVENTIONS.md section 5)
  - setState(), getMe(), setTier(), resetHistory(), refillEnergy(), fullReset()
  - getUserIdByEmail(), getRankedStatus(), getMissions()
  - Dùng endpoints từ tests/e2e/CONVENTIONS.md section 4 (AdminTestController)
- tests/e2e/fixtures/auth.ts — custom fixtures: tier1Page...tier6Page, adminPage, testApi
  - Xem PLAYWRIGHT_CODE_CONVENTIONS.md section 4 (Auth Patterns)
- tests/e2e/fixtures/api.ts — testApi fixture
- tests/e2e/pages/BasePage.ts — shared waitForLoaded(), waitForAnimationEnd()
- tests/e2e/global-setup.ts — seed data + login 6 tier users + admin → save storageState
  - POST /api/admin/seed/test-data
  - Login test1-6@dev.local + admin@biblequiz.test → save to fixtures/storage-states/
- tests/e2e/global-teardown.ts — DELETE /api/admin/seed/test-data
- Commit: "chore: add e2e infrastructure (TestApi, fixtures, global setup)"

Task B-4: Tạo Page Object Models (POM) cho core pages
- tests/e2e/pages/LoginPage.ts
- tests/e2e/pages/HomePage.ts
- tests/e2e/pages/QuizPage.ts (phức tạp nhất — xem conventions section 14)
- tests/e2e/pages/QuizResultsPage.ts
- tests/e2e/pages/RankedPage.ts
- tests/e2e/pages/PracticePage.ts
- tests/e2e/pages/DailyChallengePage.ts
- tests/e2e/pages/admin/AdminDashboardPage.ts
- Mỗi POM: locators (getByTestId), goto(), action methods, assertion helpers
- Nếu element chưa có testid → comment TODO [NEEDS TESTID: xxx] + dùng fallback selector
- Commit: "chore: add core Page Object Models for e2e"
```

**SAU KHI BOOTSTRAP XONG → verify bằng 1 smoke test đơn giản:**

```typescript
// tests/e2e/smoke/web-user/verify-setup.spec.ts
import { test, expect } from '@playwright/test';
test('Setup verification — app loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveURL('/login');
});
```

Chạy: `cd apps/web && npx playwright test tests/e2e/smoke/web-user/verify-setup.spec.ts`
Pass → xóa file verify → tiếp bước 2.
Fail → fix trước khi tiếp tục.

---

### BƯỚC 2 — CONVERT TC SPECS THÀNH CODE

**Quy tắc chuyển đổi:**

1. Đọc TC spec markdown file
2. Với MỖI test case trong file:
   - Test name = `'{TC-ID}: {Mô tả} {Tags}'`
   - Section 1 SETUP = TC spec "Setup" section → gọi testApi.setState() / testApi.setTier()
   - Section 2 ACTIONS = TC spec "Actions" section → POM methods hoặc direct page interactions
   - Section 3 UI ASSERTIONS = TC spec "Assertions" section → expect() calls
   - Section 4 API VERIFICATION = TC spec "API Verification" section (L2 @write only) → testApi.getMe() etc.
3. Notes `[NEEDS TESTID: xxx]` → comment `// TODO [NEEDS TESTID: xxx]` + dùng fallback selector
4. Notes `[NOT IMPLEMENTED]` hoặc `[DEFERRED]` → `test.skip()` với comment lý do
5. Notes `[BLOCKED]` → `test.fixme()` với comment

**Thứ tự convert — chia thành 6 phases, mỗi phase = 1 commit:**

```
Phase 1 — L1 Smoke Web User Core (5 modules, ~38 TCs)
  Đọc specs: tests/e2e/playwright/specs/smoke/
  - W-M01-auth-onboarding.md → tests/e2e/smoke/web-user/W-M01-auth.spec.ts
  - W-M02-home-profile.md → tests/e2e/smoke/web-user/W-M02-home.spec.ts
  - W-M03-practice-mode.md → tests/e2e/smoke/web-user/W-M03-practice.spec.ts
  - W-M04-ranked-mode.md → tests/e2e/smoke/web-user/W-M04-ranked.spec.ts
  - W-M10-tier-progression.md → tests/e2e/smoke/web-user/W-M10-tier.spec.ts
  Thêm POM nếu cần: OnboardingPage.ts, ProfilePage.ts, CosmeticsPage.ts
  Commit: "test: e2e L1 smoke — auth, home, practice, ranked, tier (38 cases)"

Phase 2 — L1 Smoke Web User Rest (9 modules, ~47 TCs)
  - W-M05-daily-challenge.md → W-M05-daily.spec.ts
  - W-M06-multiplayer-lobby.md → W-M06-multiplayer.spec.ts
  - W-M07-tournaments.md → W-M07-tournaments.spec.ts
  - W-M08-journey-map.md → W-M08-journey.spec.ts
  - W-M09-church-groups.md → W-M09-groups.spec.ts
  - W-M11-variety-modes.md → W-M11-variety.spec.ts
  - W-M12-notifications.md → W-M12-notifications.spec.ts
  - W-M13-i18n.md → W-M13-i18n.spec.ts
  - W-M15-cross-cutting.md → W-M15-cross-cutting.spec.ts
  Thêm POM: MultiplayerPage.ts, TournamentPage.ts, JourneyPage.ts, GroupPage.ts, etc.
  Commit: "test: e2e L1 smoke — remaining web user modules (47 cases)"

Phase 3 — L1 Smoke Web Admin (10 modules, ~45 TCs)
  Đọc specs: tests/e2e/playwright/specs/smoke/admin/
  - A-M01 → A-M14 → tests/e2e/smoke/web-admin/A-M{xx}-{name}.spec.ts
  Thêm POM: admin/AdminUsersPage.ts, admin/AdminQuestionsPage.ts, etc.
  Commit: "test: e2e L1 smoke — web admin modules (45 cases)"

Phase 4 — L2 Happy Path Web User (14 modules, ~128 TCs)
  Đọc specs: tests/e2e/playwright/specs/happy-path/
  - W-M01 → W-M15 → tests/e2e/happy-path/web-user/W-M{xx}-{name}.spec.ts
  L2 khác L1:
  - PHẢI có beforeEach setState cho @write tests
  - PHẢI có Section 4 API Verification cho @write tests
  - Assert delta (after - before) không phải absolute values
  - Dùng testApi snapshot pattern: before/after
  Commit: "test: e2e L2 happy path — web user (128 cases)"

Phase 5 — L2 Happy Path Web Admin (10 modules, ~72 TCs)
  Đọc specs: tests/e2e/playwright/specs/happy-path/admin/
  - A-M01 → A-M14 → tests/e2e/happy-path/web-admin/A-M{xx}-{name}.spec.ts
  Commit: "test: e2e L2 happy path — web admin (72 cases)"

Phase 6 — Regression + Cleanup
  - Chạy full suite: npx playwright test
  - Fix flaky tests (chạy 3 lần liên tiếp phải pass)
  - Thống kê: bao nhiêu pass / skip / fixme
  - Cập nhật tests/e2e/INDEX.md: đánh dấu code status
  - Cập nhật TODO.md
  - Commit: "test: e2e regression pass + index update"
```

---

### QUY TẮC QUAN TRỌNG KHI CONVERT

**1. Thêm data-testid vào source code KHI CẦN:**

TC specs đánh dấu `[NEEDS TESTID: xxx]`. Khi convert:
- Tìm component/page trong `apps/web/src/` tương ứng
- Thêm `data-testid="xxx"` vào đúng element
- Follow naming convention: `{page}-{element}[-{variant}]` (kebab-case)
- KHÔNG thay đổi logic/styling — chỉ thêm attribute
- Test thêm testid KHÔNG được break unit tests hiện có (Tầng 2 check)

**Ví dụ:**
```tsx
// TRƯỚC (không có testid)
<button onClick={handleStart}>Bắt đầu</button>

// SAU (thêm testid)
<button data-testid="ranked-start-btn" onClick={handleStart}>Bắt đầu</button>
```

**2. File spec → code mapping:**
```
TC spec file                                    → Playwright code file
tests/e2e/playwright/specs/smoke/W-M01-*.md     → tests/e2e/smoke/web-user/W-M01-auth.spec.ts
tests/e2e/playwright/specs/happy-path/W-M01-*.md → tests/e2e/happy-path/web-user/W-M01-auth.spec.ts
tests/e2e/playwright/specs/smoke/admin/A-M01-*.md → tests/e2e/smoke/web-admin/A-M01-dashboard.spec.ts
```

**3. Auth pattern chọn theo TC spec:**
```
TC spec ghi "Auth: no auth (guest)"           → page fixture bình thường
TC spec ghi "Auth: storageState=tier3"        → tier3Page custom fixture
TC spec ghi "Auth: fresh login as test3@..."  → fresh login trong test setup
TC spec ghi "Auth: fresh login as admin@..."  → adminPage custom fixture hoặc fresh login
```

**4. Khi TC spec có "NOT IMPLEMENTED" hoặc action không khả thi:**
```typescript
test.skip('W-M12-L2-001: Notification panel hiển thị danh sách @happy', async () => {
  // SKIP: Notification panel chưa implement — xem INDEX.md Phase 5
});
```

**5. KHÔNG tự thêm test case mới ngoài TC spec.**
Chỉ convert 1:1 từ spec sang code. Nếu phát hiện gap → ghi TODO, KHÔNG tự viết test mới.

---

### CHECKLIST MỖI PHASE

Trước khi commit mỗi phase:

```
□ Tất cả TC IDs trong spec file đã có test tương ứng trong .spec.ts
□ Mỗi test có 4 sections (Setup/Actions/UI Assert/API Verify) — L1 có thể skip Setup + API Verify
□ Không có page.waitForTimeout() (grep kiểm tra)
□ Không có hardcoded userId (grep kiểm tra)
□ @write tests có beforeEach setState
□ @write tests (L2) có API Verification section
□ POM đã tạo cho mọi page/route trong phase
□ Unit tests hiện có vẫn pass (npx vitest run) — thêm testid KHÔNG break unit tests
□ Playwright tests pass: npx playwright test tests/e2e/{phase-dir}/
□ Test chạy 3 lần liên tiếp không flaky
□ TODO.md đã cập nhật
```

---

### GHI VÀO TODO.md

Trước khi bắt đầu code, ghi tất cả tasks vào TODO.md theo format:

```markdown
## E2E Playwright Code — Convert TC Specs [IN PROGRESS]

### Bootstrap
- Task B-1: Cài Playwright + config — [ ] TODO
- Task B-2: Tạo folder structure — [ ] TODO
- Task B-3: Infrastructure (TestApi, fixtures, global setup) — [ ] TODO
- Task B-4: Page Object Models — [ ] TODO

### Phase 1: L1 Smoke Web User Core (38 TCs)
- W-M01 Auth (9 TCs) — [ ] TODO
- W-M02 Home (9 TCs) — [ ] TODO
- W-M03 Practice (8 TCs) — [ ] TODO
- W-M04 Ranked (7 TCs) — [ ] TODO
- W-M10 Tier (8 TCs) — [ ] TODO
- Commit + verify — [ ] TODO

### Phase 2: L1 Smoke Web User Rest (47 TCs)
- W-M05 → W-M15 (9 modules) — [ ] TODO
- Commit + verify — [ ] TODO

### Phase 3: L1 Smoke Web Admin (45 TCs)
- A-M01 → A-M14 (10 modules) — [ ] TODO
- Commit + verify — [ ] TODO

### Phase 4: L2 Happy Path Web User (128 TCs)
- W-M01 → W-M15 (14 modules) — [ ] TODO
- Commit + verify — [ ] TODO

### Phase 5: L2 Happy Path Web Admin (72 TCs)
- A-M01 → A-M14 (10 modules) — [ ] TODO
- Commit + verify — [ ] TODO

### Phase 6: Regression + Cleanup
- Full suite pass 3x — [ ] TODO
- Update INDEX.md — [ ] TODO
- Final commit — [ ] TODO
```
