# W-M01 — Auth & Onboarding (L1 Smoke)

**Routes:** `/login`, `/onboarding`, `/onboarding/try`, `/auth/callback`
**Spec ref:** SPEC_USER §2, §14.3

---

### W-M01-L1-001 — Trang Login render đúng cho guest

**Priority**: P0
**Est. runtime**: ~2s
**Auth**: no auth (guest)
**Tags**: @smoke @auth @critical

**Setup**: none

**Preconditions**:
- App ở route `/login`
- localStorage empty (fresh context)

**Actions**:
1. `page.goto('/login')`
2. `page.waitForSelector('input[type="email"]')`

**Assertions**:
- `expect(page).toHaveURL('/login')`
- `expect(page.getByTestId('login-email-input')).toBeVisible()`
- `expect(page.getByTestId('login-password-input')).toBeVisible()`
- `expect(page.getByTestId('login-submit-btn')).toBeVisible()`
- `expect(page.getByTestId('login-google-btn')).toBeVisible()`
- `expect(page.getByTestId('login-guest-link')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: login-email-input] — `input[type="email"]` placeholder "email@example.com"
- [NEEDS TESTID: login-password-input] — `input[type="password"]` placeholder "••••••••"
- [NEEDS TESTID: login-submit-btn] — nút "Login" cuối form
- [NEEDS TESTID: login-google-btn] — nút "Continue with Google"
- [NEEDS TESTID: login-guest-link] — link "Play as Guest"

---

### W-M01-L1-002 — Đăng nhập email/password hợp lệ thành công

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: fresh login as test3@dev.local
**Tags**: @smoke @auth @critical

**Setup**:
- Seed data đã chạy (`POST /api/admin/seed/test-data`)

**Preconditions**:
- App ở route `/login`
- localStorage empty (fresh context)

**Actions**:
1. `page.goto('/login')`
2. `page.getByTestId('login-email-input').fill('test3@dev.local')`
3. `page.getByTestId('login-password-input').fill('Test@123456')`
4. `page.getByTestId('login-submit-btn').click()`
5. `page.waitForURL('/')`

**Assertions**:
- `expect(page).toHaveURL('/')`
- `expect(page.getByTestId('home-page')).toBeVisible()`
- `expect(await page.evaluate(() => localStorage.getItem('userName'))).toBeTruthy()`

**Cleanup**: none (storageState sẽ được dùng lại)

**Notes**:
- Access token lưu in-memory (không verify localStorage), chỉ verify redirect và home page hiển thị

---

### W-M01-L1-003 — Đăng nhập với credentials sai → hiện error

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: no auth (guest)
**Tags**: @smoke @auth @critical

**Setup**: none

**Preconditions**:
- App ở route `/login`

**Actions**:
1. `page.goto('/login')`
2. `page.getByTestId('login-email-input').fill('wrong@email.com')`
3. `page.getByTestId('login-password-input').fill('WrongPassword1')`
4. `page.getByTestId('login-submit-btn').click()`
5. `page.waitForSelector('[data-testid="login-error-msg"]')`

**Assertions**:
- `expect(page).toHaveURL('/login')` ← không redirect
- `expect(page.getByTestId('login-error-msg')).toBeVisible()`
- `expect(page.getByTestId('login-submit-btn')).toBeEnabled()` ← có thể thử lại

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: login-error-msg] — div lỗi hiện khi credentials sai

---

### W-M01-L1-004 — Submit form login với email trống → HTML5 validation ngăn submit

**Priority**: P1
**Est. runtime**: ~2s
**Auth**: no auth (guest)
**Tags**: @smoke @auth

**Setup**: none

**Preconditions**:
- App ở route `/login`

**Actions**:
1. `page.goto('/login')`
2. `page.getByTestId('login-password-input').fill('SomePassword1')`
3. `page.getByTestId('login-submit-btn').click()`

**Assertions**:
- `expect(page).toHaveURL('/login')` ← không submit, không redirect
- `expect(page.getByTestId('login-error-msg')).not.toBeVisible()` ← không có server error, chỉ HTML5 validation

**Cleanup**: none

---

### W-M01-L1-005 — User đã đăng nhập truy cập /login → redirect về /

**Priority**: P1
**Est. runtime**: ~2s
**Auth**: storageState=tier3
**Tags**: @smoke @auth

**Setup**: none

**Preconditions**:
- User đã authenticated (storageState loaded)

**Actions**:
1. `page.goto('/login')`

**Assertions**:
- `expect(page).toHaveURL('/')` ← auto-redirect
- `expect(page.getByTestId('home-page')).toBeVisible()`

**Cleanup**: none

---

### W-M01-L1-006 — Guest click "Play as Guest" → vào app không cần đăng nhập

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: no auth (guest)
**Tags**: @smoke @auth

**Setup**: none

**Preconditions**:
- App ở route `/login`

**Actions**:
1. `page.goto('/login')`
2. `page.getByTestId('login-guest-link').click()`
3. `page.waitForURL('/')`

**Assertions**:
- `expect(page).toHaveURL('/')`
- `expect(page.getByTestId('landing-page')).toBeVisible()` ← guest thấy LandingPage, không phải Home

**Cleanup**: none

---

### W-M01-L1-007 — Onboarding: chọn ngôn ngữ và xem slides

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: no auth (guest)
**Tags**: @smoke @onboarding

**Setup**: none

**Preconditions**:
- App ở route `/onboarding`

**Actions**:
1. `page.goto('/onboarding')`
2. `page.getByTestId('onboarding-lang-vi').click()` ← chọn Tiếng Việt
3. `page.getByTestId('onboarding-next-btn').click()` ← slide 1 → 2
4. `page.getByTestId('onboarding-next-btn').click()` ← slide 2 → 3
5. `page.getByTestId('onboarding-start-btn').click()` ← slide 3 → try quiz

**Assertions**:
- `expect(page).toHaveURL('/onboarding/try')`
- `expect(page.getByTestId('try-quiz-question')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: onboarding-lang-vi] — card chọn "Tiếng Việt"
- [NEEDS TESTID: onboarding-lang-en] — card chọn "English"
- [NEEDS TESTID: onboarding-next-btn] — nút "Next" trên slides 1-2
- [NEEDS TESTID: onboarding-start-btn] — nút "Start" trên slide 3
- [NEEDS TESTID: try-quiz-question] — text câu hỏi trên trang try quiz

---

### W-M01-L1-008 — Onboarding try quiz: trả lời 3 câu → thấy kết quả

**Priority**: P1
**Est. runtime**: ~8s
**Auth**: no auth (guest)
**Tags**: @smoke @onboarding

**Setup**: none

**Preconditions**:
- App ở route `/onboarding/try`
- 3 sample questions đã load (từ `/api/public/sample-questions`)

**Actions**:
1. `page.goto('/onboarding/try')`
2. `page.waitForSelector('[data-testid="try-quiz-question"]')`
3. `page.getByTestId('quiz-option-a').click()` ← câu 1
4. `page.getByTestId('onboarding-next-btn').click()`
5. `page.getByTestId('quiz-option-b').click()` ← câu 2
6. `page.getByTestId('onboarding-next-btn').click()`
7. `page.getByTestId('quiz-option-a').click()` ← câu 3
8. `page.getByTestId('onboarding-next-btn').click()`
9. `page.waitForSelector('[data-testid="try-quiz-results"]')`

**Assertions**:
- `expect(page.getByTestId('try-quiz-results')).toBeVisible()`
- `expect(page.getByTestId('try-quiz-score')).toHaveText(/[0-3]\/3/)`
- `expect(page.getByTestId('try-quiz-register-btn')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: quiz-option-a, quiz-option-b, quiz-option-c, quiz-option-d] — 4 đáp án (A/B/C/D)
- [NEEDS TESTID: try-quiz-results] — results card sau khi trả lời xong
- [NEEDS TESTID: try-quiz-score] — text hiển thị "X/3"
- [NEEDS TESTID: try-quiz-register-btn] — nút "Đăng ký" trong results
- API `/api/public/sample-questions` phải hoạt động (không cần auth)

---

### W-M01-L1-009 — Đăng xuất xóa session

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @auth

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/')`
2. `page.waitForSelector('[data-testid="home-page"]')`
3. `page.getByTestId('sidebar-logout-btn').click()` ← hoặc menu logout
4. `page.waitForURL('/login')`

**Assertions**:
- `expect(page).toHaveURL('/login')`
- `expect(await page.evaluate(() => localStorage.getItem('userName'))).toBeNull()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: sidebar-logout-btn] — nút Logout trong sidebar/menu
- `POST /api/auth/logout` được gọi để blacklist token

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Email input | `login-email-input` | Login.tsx |
| Password input | `login-password-input` | Login.tsx |
| Login submit button | `login-submit-btn` | Login.tsx |
| Google OAuth button | `login-google-btn` | Login.tsx |
| Guest play link | `login-guest-link` | Login.tsx |
| Login error message | `login-error-msg` | Login.tsx |
| Language Vi card | `onboarding-lang-vi` | Onboarding.tsx |
| Language En card | `onboarding-lang-en` | Onboarding.tsx |
| Next slide button | `onboarding-next-btn` | Onboarding.tsx |
| Start button (slide 3) | `onboarding-start-btn` | Onboarding.tsx |
| Try quiz question | `try-quiz-question` | OnboardingTryQuiz.tsx |
| Answer A/B/C/D | `quiz-option-a` ... `quiz-option-d` | OnboardingTryQuiz.tsx |
| Try quiz results | `try-quiz-results` | OnboardingTryQuiz.tsx |
| Try quiz score | `try-quiz-score` | OnboardingTryQuiz.tsx |
| Register CTA | `try-quiz-register-btn` | OnboardingTryQuiz.tsx |
| Sidebar logout | `sidebar-logout-btn` | AppLayout.tsx |

---

## NOT IMPLEMENTED Summary

| Feature | Spec ref | Notes |
|---------|---------|-------|
| Google OAuth full flow | §14.3 | Button exists, nhưng cần external Google — test chỉ verify button visible |
| "Forgot password" flow | §2 | Link visible nhưng route/endpoint chưa implement |
