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

### Quy ước đề xuất (chờ approve)

> ⚠️ **CHƯA ÁP DỤNG** — cần bui approve trước khi thêm testid vào codebase.

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

## 2. Auth Strategy

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

## 3. Test Data Strategy

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

## 4. Login Endpoint

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

## 5. Cleanup Policy

| Loại test | Cleanup cần thiết |
|-----------|------------------|
| Read-only (xem data) | Không cần |
| Write (tạo group, post comment...) | `afterEach`: DELETE resource vừa tạo |
| Thay đổi user state | `afterEach`: `POST /api/admin/test/users/{id}/full-reset` |
| Tier-up test | `afterEach`: `POST /api/admin/test/users/{id}/set-tier?tierLevel=original` |

---

## 6. Naming Conventions

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
@smoke          L1 smoke test
@happy-path     L2 full flow
@edge           L3 edge case
@critical       P0 — release blocker nếu fail
@auth           liên quan auth flow
@admin          admin panel
@write          test thay đổi data (cần cleanup)
@websocket      cần WebSocket (deferred)
@dev-only       chỉ chạy trên dev (dùng TestDataSeeder)
```

### File names

```
playwright/specs/smoke/W-M01-auth-onboarding.md
playwright/specs/smoke/W-M02-home-profile.md
playwright/specs/smoke/admin/A-M01-dashboard.md
```
