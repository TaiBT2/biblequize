# W-M11 — Variety Modes (L2 Happy Path)

**Routes:** `/weekly-quiz`, `/mystery-mode`, `/speed-round`
**Spec ref:** SPEC_USER §5.6
**Module priority:** Tier 2 (XP multipliers + weekly/seasonal themes)

---

## Mode Overview

| Mode | Endpoint | Config | XP Multiplier |
|------|----------|--------|---------------|
| **Weekly Theme** | `GET /api/quiz/weekly` | 10 questions từ theme-specific books, language-based | 1.0 (no multiplier, only theme filter) |
| **Mystery** | `POST /api/quiz/mystery` | 10 questions random all-books/all-difficulties | **1.5x** |
| **Speed Round** | `GET /api/quiz/speed-round` | 10 EASY questions, 10s/question | **2.0x** |
| **Daily Bonus** | `GET /api/quiz/daily-bonus` | Deterministic per user/day, ~14% chance (1/7) | Variable (DOUBLE_XP, EXTRA_ENERGY, FREE_FREEZE, BONUS_STREAK) |
| **Seasonal** | `GET /api/quiz/seasonal` | Christmas (Dec 1-25) or Easter (Mar-Apr 20) | 1.5x event bonus |

---

## ⚠️ XP Multiplier Application

**CRITICAL**: Các `xpMultiplier` field từ endpoints là **client hint** — server khi submit answer **không tự động áp dụng** multiplier trừ khi answer endpoint biết mode context.

Questions sẽ được submit qua `/api/sessions/{id}/answer` hoặc `/api/ranked/sessions/{id}/answer` — **neither** endpoint đọc `xpMultiplier` từ variety response. Mode không propagate vào scoring.

**Impact**: Tests L2 verify multiplier **chỉ ở UI display level** hoặc cần API contract mới để pass mode context vào scoring.

---

## W-M11-L2-001 — Weekly Quiz: GET /api/quiz/weekly returns theme + 10 questions

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: storageState=tier3
**Tags**: @happy-path @variety @weekly @parallel-safe

**Actions**:
1. `GET /api/quiz/weekly?language=vi`

**API Verification**:
- Response có:
  - `themeKey` (string, e.g. "creation", "covenant")
  - `themeTitle` (Vietnamese)
  - `themeDescription`
  - `bookFilter` (array of books cho theme)
  - `questions` array length = 10
  - `questionCount: 10`
- Theme rotates weekly — verify same theme cho cả tuần (use `/api/quiz/weekly/theme`)

**Notes**:
- Parallel-safe, read-only
- 10 themes total per spec — theme selection deterministic based on week-of-year

---

## W-M11-L2-002 — Weekly theme metadata: GET /api/quiz/weekly/theme (no auth)

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: no auth (guest)
**Tags**: @happy-path @variety @weekly @parallel-safe

**Actions**:
1. `GET /api/quiz/weekly/theme?language=en`

**API Verification**:
- Response có `themeKey`, `themeTitle` (English), `themeDescription`
- English translation different from Vietnamese

---

## W-M11-L2-003 — Mystery Mode: POST /api/quiz/mystery returns 10 questions + xpMultiplier=1.5

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @variety @mystery @write @serial

**Actions**:
1. `POST /api/quiz/mystery?language=vi`

**API Verification**:
- Response:
  - `questions` length = 10
  - `questionCount: 10`
  - **`xpMultiplier: 1.5`**
  - `timerSeconds: 25`
- Questions mixed difficulty (easy/medium/hard) — verify distribution không phải 100% một difficulty

**Notes**:
- Smart selector chọn questions dựa trên user history — test user cần có history variety

---

## W-M11-L2-004 — Speed Round: GET /api/quiz/speed-round returns 10 EASY questions + timerSeconds=10 + xpMultiplier=2.0

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @variety @speed @write @serial

**Actions**:
1. `GET /api/quiz/speed-round?language=vi`

**API Verification**:
- Response:
  - `available: true`
  - `questions` length = 10
  - **All questions `difficulty: "easy"`** (filter applied)
  - **`timerSeconds: 10`**
  - **`xpMultiplier: 2.0`**

---

## W-M11-L2-005 — Speed Round UI: timer display là 10s per question

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @variety @speed @write @serial

**Actions**:
1. `page.goto('/speed-round')`
2. Start quiz
3. `page.waitForSelector('[data-testid="quiz-timer"]')`

**Assertions** (UI):
- Timer visible với initial value 10 (không phải 30 như practice/ranked)
- Timer countdown từ 10 → 0

**API Verification**:
- POST `/api/sessions` (hoặc endpoint alternative) với `timePerQuestion: 10` được fired
- `GET /api/sessions/{id}` → questions có `timeLimitSec: 10`

**Notes**:
- [NEEDS CODE READ]: Confirm Speed Round có tạo session qua `/api/sessions` với timePerQuestion=10 hay dùng endpoint riêng

---

## W-M11-L2-006 — Daily Bonus: deterministic per user/day — same user/day → same result

**Priority**: P1
**Est. runtime**: ~4s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @variety @bonus @write @serial

**Actions**:
1. `GET /api/quiz/daily-bonus` — call 1
2. `GET /api/quiz/daily-bonus` — call 2 (cùng ngày, cùng user)

**API Verification**:
- Both calls return identical response body
- Response format:
  - Nếu `hasBonus: false` → chỉ có `hasBonus`
  - Nếu `hasBonus: true` → có `bonusType`, `message`, `value`
- Deterministic formula: `seed = userId.hashCode() * 1000 + today.toEpochDay()`, `isLucky = random.nextInt(7) == 0`

**Notes**:
- Seed calculation verified trong VarietyQuizController line 117-119
- Cross-day test: không khả thi trong 1 test session (cần clock manipulation)

---

## W-M11-L2-007 — Daily Bonus: 2 users different results (likely)

**Priority**: P2
**Est. runtime**: ~4s
**Auth**: 2 separate fresh logins
**Tags**: @happy-path @variety @bonus @write @serial

**Actions**:
1. Login test1@dev.local, `GET /api/quiz/daily-bonus`
2. Logout, login test3@dev.local, `GET /api/quiz/daily-bonus`

**API Verification**:
- Probability ~14% có bonus → trong 2 users, có khả năng khác nhau
- Cannot assert strict difference (probabilistic), chỉ verify không throw error

**Notes**:
- [WEAK TEST]: Không có strict assertion — downgrade sang P2
- Better alternative: hard-code seed qua env var hoặc admin endpoint để test deterministic

---

## W-M11-L2-008 — Seasonal Content: GET /api/quiz/seasonal (normal season → hasEvent=false)

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: no auth (guest)
**Tags**: @happy-path @variety @seasonal @parallel-safe

**Preconditions**:
- Test date NOT in Christmas (Dec 1-25) and NOT Easter (Mar-Apr 20)
- Currently 2026-04-15 → **trong Easter season** (Mar 1 - Apr 20)

**Actions**:
1. `GET /api/quiz/seasonal?language=vi`

**API Verification**:
- Current date 2026-04-15 → `season: "EASTER"`, `hasEvent: true`, `xpMultiplier: 1.5`
- Response có `title: "Mùa Phục Sinh"`, `description`, `books`

**Notes**:
- Date-dependent test — assertions phải tính theo date lúc chạy
- Nếu chạy sau Apr 20 → `season: "NORMAL"`, `hasEvent: false`

---

## W-M11-L2-009 — Seasonal Christmas: mock date → season=CHRISTMAS

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: no auth (guest)
**Tags**: @happy-path @variety @seasonal

**Setup**:
- **[BLOCKED]**: Cần admin endpoint để mock system date HOẶC test chạy trong Dec 1-25
- Alternative: unit test backend VarietyQuizService với mocked LocalDate

**Actions**:
1. `GET /api/quiz/seasonal`

**API Verification** (trong Dec 1-25):
- `season: "CHRISTMAS"`, `title: "Mùa Giáng Sinh"`, `books: ["Matthew", "Luke", "Isaiah"]`

**Notes**:
- [BLOCKED: date mocking]
- Date logic: line 160 `month == 12 && day >= 1 && day <= 25`

---

## W-M11-L2-010 — Weekly theme quiz UI: navigate /weekly-quiz → theme header + questions

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @happy-path @variety @weekly @parallel-safe

**Actions**:
1. `page.goto('/weekly-quiz')`
2. `page.waitForSelector('[data-testid="weekly-page"]')`

**Assertions** (UI):
- `expect(page.getByTestId('weekly-theme-title')).toBeVisible()`
- `expect(page.getByTestId('weekly-theme-description')).toBeVisible()`
- `expect(page.getByTestId('weekly-start-btn')).toBeEnabled()`

**Notes**:
- [NEEDS TESTID: weekly-page, weekly-theme-title, weekly-theme-description, weekly-start-btn]

---

## W-M11-L2-011 — Mystery Mode UI: navigate /mystery-mode → start button + multiplier display

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @happy-path @variety @mystery @parallel-safe

**Actions**:
1. `page.goto('/mystery-mode')`

**Assertions** (UI):
- `expect(page.getByTestId('mystery-page')).toBeVisible()`
- `expect(page.getByTestId('mystery-multiplier-badge')).toContainText(/1\.5x|1,5x/)`
- `expect(page.getByTestId('mystery-start-btn')).toBeEnabled()`

---

## W-M11-L2-012 — Speed Round scoring: NOT automatically 2x — verify gap

**Priority**: P1
**Est. runtime**: ~20s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @variety @speed @scoring @write @serial

**Rationale**: Test phát hiện gap — xpMultiplier trong response KHÔNG tự động apply ở scoring.

**Setup**:
- Reset state

**Actions**:
1. Start speed-round quiz
2. Answer 1 easy correct trong 3s
3. Measure XP gained qua `GET /api/me` delta

**API Verification**:
- Nếu xpMultiplier được áp dụng: delta = `practiceEasyScore × 2.0`
- Nếu KHÔNG áp dụng (current behavior): delta = `practiceEasyScore × 1.0`
- Test này assert actual behavior — **likely FAIL nếu spec kỳ vọng 2x**

**Notes**:
- Test này EXPOSE implementation gap giữa spec và code
- Outcome phụ thuộc actual implementation — có thể cần feature request

---

## NEEDS TESTID Summary (W-M11 L2)

| Element | Suggested testid | File |
|---------|-----------------|------|
| Weekly page | `weekly-page` | pages/WeeklyQuiz.tsx |
| Weekly theme title | `weekly-theme-title` | pages/WeeklyQuiz.tsx |
| Weekly theme description | `weekly-theme-description` | pages/WeeklyQuiz.tsx |
| Weekly start btn | `weekly-start-btn` | pages/WeeklyQuiz.tsx |
| Mystery page | `mystery-page` | pages/MysteryMode.tsx |
| Mystery multiplier badge | `mystery-multiplier-badge` | pages/MysteryMode.tsx |
| Mystery start btn | `mystery-start-btn` | pages/MysteryMode.tsx |
| Speed page | `speed-round-page` | pages/SpeedRound.tsx |
| Speed timer | `speed-round-timer` | pages/SpeedRound.tsx |

---

## NOT IMPLEMENTED / BLOCKERS

| # | Issue | Impact |
|---|-------|--------|
| 1 | **xpMultiplier NOT auto-applied in scoring** | L2-012 will fail — gap between spec and implementation |
| 2 | Date mocking for seasonal | L2-009 blocked |
| 3 | Speed Round session creation endpoint | L2-005 uncertain — confirm mechanism |

---

## Open Questions

1. Speed Round scoring: có apply 2x multiplier không? Nếu không, cần implement.
2. Mystery Mode scoring: 1.5x apply ở đâu? Server-side hay client display only?
3. Weekly theme selection: hash-based on week number deterministic?
4. Daily Bonus: bonus types (DOUBLE_XP, etc.) — mỗi type implement như thế nào? DOUBLE_XP có cộng vào xpSurge flag không?
5. Seasonal event: 1.5x multiplier apply ở đâu?

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 4s |
| L2-002 | 3s |
| L2-003 | 4s |
| L2-004 | 4s |
| L2-005 | 6s |
| L2-006 | 4s |
| L2-007 | 4s |
| L2-008 | 3s |
| L2-009 | 3s ⚠️ blocked |
| L2-010 | 5s |
| L2-011 | 5s |
| L2-012 | 20s |
| **Total** | **~65s (~1.1 min)** |

Parallel-safe: 5 cases (L2-001, L2-002, L2-008, L2-010, L2-011).

---

## Summary

- **12 cases** total
- **P0**: 4 | **P1**: 7 | **P2**: 1
- **BLOCKED**: 1 (seasonal date mock)
- **GAP DETECTED**: xpMultiplier không auto-apply trong scoring — L2-012 designed để expose issue
- **NEEDS TESTID**: 9 elements
- **Runtime**: ~1.1 min serial
