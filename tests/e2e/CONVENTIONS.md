# E2E Conventions — BibleQuiz

## 1. data-testid Policy

### Hiện trạng (scan 2026-04-15)

- **Tổng số**: 17 unique `data-testid` trong `apps/web/src/`
- **Mobile**: 0 (React Native không dùng HTML attributes)
- **Coverage**: Rất thấp — chủ yếu ở Groups, Tournaments, và tests. Phần lớn screens chưa có testid.

**Các testid hiện có:**
```
app-layout, home-page, landing-page
game-mode-grid
tournaments-skeleton, tournaments-error, tournaments-empty, tournaments-list
groups-skeleton, no-group, group-error
input, pass-input, disabled-input, submit-btn
loading, multiplayer
```

**Nhận xét**: kebab-case, page-scoped prefix (tournaments-*, groups-*), nhưng chưa nhất quán (vd: `submit-btn` không có prefix page).

---

### Quy ước (✅ đã approve 2026-04-15)

> Áp dụng khi thêm testid mới vào codebase. Không đổi các testid cũ đang có.

**Format**: `{page}-{element}[-{variant}]`

| Phần | Rule | Ví dụ |
|------|------|-------|
| `page` | tên page/component, kebab-case | `login`, `home`, `quiz`, `admin-users` |
| `element` | loại element | `form`, `input`, `btn`, `list`, `item`, `badge`, `card`, `modal` |
| `variant` (optional) | trạng thái hoặc chỉ số | `skeleton`, `error`, `empty`, `0`..`3` |

**Ví dụ cụ thể:**

```
// Auth
login-email-input
login-password-input
login-submit-btn
login-error-msg
login-google-btn

// Home
home-tier-badge
home-energy-bar
home-user-name
home-streak-count

// Quiz
quiz-question-text
quiz-answer-0, quiz-answer-1, quiz-answer-2, quiz-answer-3
quiz-timer
quiz-combo-banner
quiz-result-score

// Admin
admin-users-table
admin-users-search-input
admin-questions-create-btn
admin-review-approve-btn
admin-review-reject-btn
```

**Rules:**
- Luôn dùng kebab-case
- Prefix bằng page/scope (không dùng testid chung chung như `button`, `input`)
- State variants: `-skeleton`, `-error`, `-empty`, `-loading`
- Lists: `-list`, `-item` (item có thể thêm index `-item-0`)
- Không encode logic vào testid (không dùng `correct-answer-btn`)

---

### Selector priority (khi viết Playwright code)

```
1. getByTestId('...')          ← ưu tiên nhất, stable nhất
2. getByRole('button', { name: '...' })   ← semantic HTML
3. getByLabel('...')           ← form inputs với label
4. getByText('...')            ← text tĩnh, ổn định
5. locator('.class-name')      ← CSS class, tránh dùng
6. locator('nth=...')          ← tuyệt đối tránh, fragile
```

---

## 2. Test User Credentials

> ⚠️ Chỉ dùng ở môi trường **dev/staging**. Backend guard: `@Profile("!prod")`. Không commit credentials thật.

### Tier test users (test1-6@dev.local)

| Email | Password | Tier | Points | Tên tier |
|-------|----------|------|--------|----------|
| `test1@dev.local` | `Test@123456` | 1 | 0 | Tân Tín Hữu |
| `test2@dev.local` | `Test@123456` | 2 | ~2,500 | Người Tìm Kiếm |
| `test3@dev.local` | `Test@123456` | 3 | ~8,000 | Môn Đồ |
| `test4@dev.local` | `Test@123456` | 4 | ~20,000 | Hiền Triết |
| `test5@dev.local` | `Test@123456` | 5 | ~65,000 | Tiên Tri |
| `test6@dev.local` | `Test@123456` | 6 | ~110,000 | Sứ Đồ |

### Admin / seeded users (@biblequiz.test)

| Email | Password | Role | Notes |
|-------|----------|------|-------|
| `admin@biblequiz.test` | *(set by seeder — xem TestDataSeeder)* | ADMIN | Dùng gọi per-test endpoints |
| `banned@biblequiz.test` | *(set by seeder)* | USER (BANNED) | Test banned state |

> **Lưu ý**: `@biblequiz.test` users không có password hardcoded. Để login bằng Playwright, dùng `test1-6@dev.local` hoặc gọi API trực tiếp với admin session.

### RankTier thresholds (để tham chiếu)

| Tier | Tên | Required Points |
|------|-----|----------------|
| 1 | Tân Tín Hữu | 0 |
| 2 | Người Tìm Kiếm | 1,000 |
| 3 | Môn Đồ | 5,000 |
| 4 | Hiền Triết | 15,000 |
| 5 | Tiên Tri | 40,000 |
| 6 | Sứ Đồ | 100,000 |

---

## 3. Auth Strategy

### Khi nào dùng storageState

**storageState** = lưu auth token sau khi login 1 lần, dùng lại cho nhiều tests:

```typescript
// global-setup.ts — chạy 1 lần trước toàn bộ suite
await page.request.post('/api/auth/login', { data: { email, password } })
await page.context().storageState({ path: 'fixtures/auth-tier3.json' })
```

**Dùng khi:**
- Test **read-only** (không thay đổi state user)
- Test cần user đã đăng nhập nhưng auth không phải focus của test
- Tests cần chạy nhanh (bỏ qua login flow)

**Fixture files cần tạo** (global setup):
```
playwright/fixtures/
├── auth-tier1.json   ← test user tier 1
├── auth-tier2.json   ← test user tier 2
├── auth-tier3.json   ← test user tier 3
├── auth-tier4.json   ← test user tier 4
├── auth-tier5.json   ← test user tier 5
├── auth-tier6.json   ← test user tier 6
└── auth-admin.json   ← admin user
```

### Khi nào dùng fresh login

**Fresh login** = gọi API login trực tiếp trong test setup:

```typescript
// Trong beforeEach hoặc setup của test
const response = await request.post('/api/auth/login', {
  data: { email: 'test3@dev.local', password: 'password123' }
})
const { accessToken } = await response.json()
```

**Dùng khi:**
- Test **write** (thay đổi state, cần user sạch)
- Test chính auth flow
- Test cần user ở trạng thái đặc biệt (sau khi gọi set-tier, reset-history)
- Test logout / session expiry

### Trong spec, ghi rõ:

```
Auth: storageState=tier3                   ← read-only, dùng fixture
Auth: fresh login as test5@dev.local       ← write test, login trong setup
Auth: no auth (guest)                      ← không login
Auth: fresh login as admin@biblequiz.test  ← admin test
```

---

## 4. Test Data Strategy

### TestDataSeeder (global setup/teardown)

```
// Trước toàn bộ test suite:
POST /api/admin/seed/test-data
  → 20 users (2 admin, 18 regular, 1 banned)
  → groups, sessions, questions, ...

// Sau toàn bộ test suite:
DELETE /api/admin/seed/test-data
```

**Gọi từ `global-setup.ts`** — cần admin credentials.

### Per-test endpoints (AdminTestController)

Dùng khi test cần state đặc biệt:

```
POST /api/admin/test/users/{userId}/set-tier?tierLevel=1-6
POST /api/admin/test/users/{userId}/refill-energy
POST /api/admin/test/users/{userId}/reset-history
POST /api/admin/test/users/{userId}/mock-history?percentSeen=50&percentWrong=20
POST /api/admin/test/users/{userId}/set-streak?days=7
POST /api/admin/test/users/{userId}/full-reset
GET  /api/admin/test/users/{userId}/preview-questions?count=10
```

**Lưu ý**: Tất cả endpoints yêu cầu `ADMIN` role. Chỉ hoạt động ở `dev` profile.

### Test Users

**Seeded users** (sau khi chạy `POST /api/admin/seed/test-data`):

| Email | Role | Notes |
|-------|------|-------|
| `admin@biblequiz.test` | ADMIN | Dùng cho admin tests + gọi per-test endpoints |
| `mod@biblequiz.test` | ADMIN | Mod user |
| `mucsu.minh@biblequiz.test` | USER | Regular user |
| `banned@biblequiz.test` | USER (BANNED) | Test banned state |
| ... (16 more) | USER | Xem TestDataSeeder.java |

**Tier test users** (từ SPEC_ADMIN §17.6, dùng `set-tier` endpoint để set):
```
test1@dev.local → Tier 1 (0 pts)
test2@dev.local → Tier 2 (1500 pts)
test3@dev.local → Tier 3 (8000 pts)
test4@dev.local → Tier 4 (20000 pts)
test5@dev.local → Tier 5 (50000 pts)
test6@dev.local → Tier 6 (100000 pts)
```

> ⚠️ **Chú ý**: test1-6@dev.local không nằm trong TestDataSeeder hiện tại.
> Cần xác nhận với bui: dùng seeded users rồi set-tier, hay tạo test1-6 users riêng?

---

## 5. Login Endpoint

### Web (Playwright tests)

```
POST /api/auth/login
Body: { email, password }
Response: { accessToken, name, email, avatar, role }
```

- Access token lưu **in-memory** (không có trong localStorage/cookie JS-accessible)
- Refresh token là **httpOnly cookie** (auto-gửi kèm request)
- Playwright dùng `withCredentials: true` (axios config đã set sẵn)

### Mobile (Maestro tests — Phase 3)

```
POST /api/auth/mobile/login
Body: { email, password }
Response: { accessToken, refreshToken, id, name, email, avatar, role }
```

---

## 6. Cleanup Policy

| Loại test | Cleanup cần thiết |
|-----------|------------------|
| Read-only (xem data) | Không cần |
| Write (tạo group, post comment...) | `afterEach`: DELETE resource vừa tạo |
| Thay đổi user state | `afterEach`: `POST /api/admin/test/users/{id}/full-reset` |
| Tier-up test | `afterEach`: `POST /api/admin/test/users/{id}/set-tier?tierLevel=original` |

---

## 8. Isolation Strategy (L2 Happy Path trở lên)

### Nguyên tắc cốt lõi

> **Mỗi test phải tự setup state mình cần trong `beforeEach`. KHÔNG BAO GIỜ đọc state từ test trước.**
> Test order không determnistic (parallel, shuffle, `--grep`) — đừng assume thứ tự.

### Per-tier user assignment

Mặc định 1 tier dùng 1 test user cố định. Map:

```
tier 1 state  → test1@dev.local
tier 2 state  → test2@dev.local
tier 3 state  → test3@dev.local
tier 4 state  → test4@dev.local
tier 5 state  → test5@dev.local
tier 6 state  → test6@dev.local
ephemeral     → tạo user mới qua seed API (cho @parallel-safe write tests)
```

### beforeEach mandatory pattern (cho tests có state)

```typescript
test.beforeEach(async ({ request }) => {
  // Reset user về trạng thái mong muốn
  await request.post('/api/admin/test/users/{userId}/set-state', {
    data: {
      livesRemaining: 10,
      questionsCounted: 0,
      daysAtTier6: 0,
      xpSurgeHoursFromNow: 0,
    }
  })
  // Nếu cần missions state:
  await request.post('/api/admin/test/users/{userId}/set-mission-state', {
    data: {
      missions: [{ missionType: 'ANSWER_5_CORRECT', progress: 0, completed: false }]
    }
  })
})
```

### Pre-seed ngưỡng pattern (cho tier-up, milestone tests)

Thay vì chạy nhiều modes để tích luỹ XP → set-state pre-seed user sát ngưỡng, rồi chỉ trigger 1 action để vượt ngưỡng:

```
Test "Tier 3 → Tier 4 bump":
  beforeEach:
    POST set-state: totalPoints=14999 (ngưỡng tier 4 = 15000)
  Action:
    Complete 1 practice question đúng → +1 XP (approx, giả định)
  Assert:
    GET /api/me → totalPoints=15000, currentTier=4
    GET /api/me/tier-progress → tier-up event fired
```

**Rule**: Test "cumulative XP across multiple game modes" là **integration test backend**, KHÔNG phải E2E concern. E2E chỉ test từng flow riêng biệt với pre-seeded state.

### Tags — 3 loại

```
@parallel-safe   — Test pure read-only HOẶC tự tạo ephemeral user qua seed API.
                   Có thể chạy parallel với bất kỳ test nào khác.
                   Ví dụ: GET /api/leaderboard; browse journey map.

@serial          — DEFAULT cho mọi test không có tag khác.
                   Test mutation trên fixed test user (test1-6@dev.local).
                   Chạy trên worker 1 duy nhất, serial trong file.
                   Buộc phải có beforeEach set-state reset.

@write           — Subset của @serial, đánh dấu rõ test sẽ modify user state.
                   BẮT BUỘC:
                     1. beforeEach: set-state reset
                     2. API Verification section trong spec
                     3. Không giả định state trước đó
                   Ví dụ: Complete quiz → verify XP tăng qua GET /api/me
```

> **Không có tag `@dirty`**. Lý do: `@write` + `beforeEach set-state` đã đủ để handle isolation.
> Nếu có case cần "leave state dirty for cross-test assertion" → đó là integration test backend, không phải E2E.

### Global setup / teardown (chạy 1 lần toàn suite)

```
Global setup:
  POST /api/admin/seed/test-data         ← seed 20 users + groups + sessions
  Login test1-6@dev.local → save storageState fixtures

Global teardown:
  DELETE /api/admin/seed/test-data       ← xoá toàn bộ seed data
```

**Không có per-file teardown dọn dẹp toàn cục.** Mỗi test self-contained qua `beforeEach`.

---

## 7. Naming Conventions

### Test Case IDs

Format: `{SCOPE}-{MODULE}-{LEVEL}-{SEQ:3}`

```
W-M01-L1-001   Web user, Module 1 Auth, Level 1 Smoke, case 001
A-M02-L1-005   Web Admin, Module 2 Users, Level 1 Smoke, case 005
APP-M04-L1-003 Mobile, Module 4 Ranked, Level 1 Smoke, case 003
```

Scopes: `W-` (Web user), `A-` (Web admin), `APP-` (Mobile)
Levels: `L1` Smoke, `L2` Happy Path, `L3` Edge Cases

### Tags

```
# Level tags
@smoke          L1 smoke test
@happy-path     L2 full flow
@edge           L3 edge case

# Priority
@critical       P0 — release blocker nếu fail

# Domain
@auth           liên quan auth flow
@admin          admin panel
@websocket      cần WebSocket (deferred)

# Isolation (exactly 1 of these per test)
@parallel-safe  Pure read-only hoặc ephemeral user. Có thể parallel với bất kỳ test nào
@serial         Default. Test mutation trên fixed user, chạy serial worker 1
@write          Subset của @serial. Buộc có beforeEach set-state + API Verification

# Environment
@dev-only       chỉ chạy trên dev (dùng TestDataSeeder)
```

### File names

```
playwright/specs/smoke/W-M01-auth-onboarding.md
playwright/specs/smoke/W-M02-home-profile.md
playwright/specs/smoke/admin/A-M01-dashboard.md
```
