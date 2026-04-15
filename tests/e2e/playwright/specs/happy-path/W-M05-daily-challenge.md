# W-M05 — Daily Challenge (L2 Happy Path)

**Routes:** `/daily`, `/quiz?mode=daily`
**Spec ref:** SPEC_USER §5.3
**Module priority:** Tier 2 (daily retention, mission system, streak continuation)

---

## Architecture Overview

- **Endpoint**: `GET /api/daily-challenge` — public, returns 5 questions + `alreadyCompleted` flag
- **Start session**: `POST /api/daily-challenge/start` — returns sessionId format `daily-{date}-{timestamp}`
- **Result**: `GET /api/daily-challenge/result` — auth required, returns completion status
- **Completion tracking**: Redis cache key `daily:completed:{userId}:{date}`, TTL 48h
- **Questions**: 5 fixed per day, shared by all users, hash-based selection from DB

## ✅ Unblocker: `POST /api/daily-challenge/complete` endpoint (commit 3ad2542)

Previously `DailyChallengeService.markCompleted()` chỉ gọi từ test code — production had no call site.

Now added: `POST /api/daily-challenge/complete` with body `{ score, correctCount }`:
1. Auth required (401 for guests)
2. Idempotent: second call same-day returns existing state without overwrite
3. Validates score (0-10000) and correctCount (0-5)
4. Calls `markCompleted(userId, score, correctCount)` on first call
5. Rejects unknown fields (@JsonIgnoreProperties(ignoreUnknown=false))

This unblocks completion tracking, streak increment, mission progress, và idempotent re-check.

---

## W-M05-L2-001 — GET /api/daily-challenge (guest) returns 5 questions, alreadyCompleted=false

**Priority**: P0
**Est. runtime**: ~3s
**Auth**: no auth (guest)
**Tags**: @happy-path @daily @parallel-safe

**Preconditions**:
- Backend running, daily challenge seeded cho hôm nay (5 questions)

**Actions**:
1. `GET /api/daily-challenge?language=vi` direct API call (no auth)

**API Verification**:
- Response 200:
  - `date`: "YYYY-MM-DD" (today UTC)
  - `questions`: array length = 5
  - Each question: `{ id, book, chapter, difficulty, type, content, options }`
  - **`correctAnswer` field NOT present** (security — stripped)
  - `alreadyCompleted: false` (guest — no auth)
  - `totalQuestions: 5`

**Notes**:
- Parallel-safe, no-auth test
- Verify question sanitization (không leak correct answer)

---

## W-M05-L2-002 — GET /api/daily-challenge (authed) returns questions + completion status

**Priority**: P0
**Est. runtime**: ~4s
**Auth**: storageState=tier3
**Tags**: @happy-path @daily @parallel-safe

**Preconditions**:
- User chưa complete daily hôm nay

**Actions**:
1. `GET /api/daily-challenge?language=vi` với auth

**API Verification**:
- Response: `alreadyCompleted: false` (initially)
- `questions` array length = 5
- Same questions cho tất cả users cùng ngày (verify bằng cách compare với guest response từ L2-001)

---

## W-M05-L2-003 — POST /api/daily-challenge/start returns sessionId format "daily-{date}-{timestamp}"

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @daily @write @serial

**Actions**:
1. `POST /api/daily-challenge/start`

**API Verification**:
- Response 200:
  - `sessionId` matches regex `^daily-\d{4}-\d{2}-\d{2}-\d+$`
  - `date`: today
  - `totalQuestions: 5`
- SessionId timestamp portion là current millis (sanity check)

**Notes**:
- Note: sessionId không phải UUID — không tương thích với `/api/sessions/{id}/answer` endpoint
- Session state ephemeral — backend không track start session trong DB

---

## W-M05-L2-004 — UI flow: navigate /daily → questions visible → start quiz button

**Priority**: P0
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @happy-path @daily @parallel-safe

**Actions**:
1. `page.goto('/daily')`
2. `page.waitForSelector('[data-testid="daily-page"]')`

**Assertions** (UI):
- `expect(page.getByTestId('daily-page')).toBeVisible()`
- `expect(page.getByTestId('daily-countdown-timer')).toBeVisible()` (countdown tới 00:00 UTC reset)
- `expect(page.getByTestId('daily-start-btn')).toBeEnabled()`
- `expect(page.getByTestId('daily-reward-display')).toContainText(/\+50|\+\d+ XP/)` (XP bonus display)

**API Verification** (intercept):
- GET `/api/daily-challenge` fired trên page load
- Response `alreadyCompleted: false`

**Notes**:
- [NEEDS TESTID: daily-page, daily-countdown-timer, daily-start-btn, daily-reward-display]

---

## W-M05-L2-005 — Start daily quiz → navigate /quiz?mode=daily, 5 questions loaded

**Priority**: P0
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @daily @write @serial

**Actions**:
1. `page.goto('/daily')`
2. `page.getByTestId('daily-start-btn').click()`
3. `page.waitForURL(/\/quiz\?mode=daily/)`
4. `page.waitForSelector('[data-testid="quiz-question-text"]')`

**Assertions**:
- URL contains `mode=daily`
- `expect(page.getByTestId('quiz-progress')).toContainText('1/5')`

**API Verification**:
- Verify POST `/api/daily-challenge/start` fired
- Question IDs visible khớp với IDs từ GET `/api/daily-challenge` response (same 5 questions)

---

## W-M05-L2-006 — Complete daily với 5/5 correct → completion tracked, +50 XP bonus

**Priority**: P0
**Est. runtime**: ~25s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @daily @scoring @write @serial

**Setup**:
- Ephemeral test user OR clear Redis key `daily_challenge:completed:{userId}:{today}` qua admin/Redis flush
- Preview 5 daily questions để biết correct answers (GET `/api/daily-challenge`)

**Actions**:
1. Start daily quiz qua UI (`POST /api/daily-challenge/start`)
2. Answer 5 câu correct (local UI, no per-answer endpoint)
3. UI fires `POST /api/daily-challenge/complete` với `{ score, correctCount: 5 }`
4. Wait for completion screen

**Assertions** (UI):
- `expect(page.getByTestId('daily-result-score')).toBeVisible()`
- `expect(page.getByTestId('daily-result-correct')).toContainText('5/5')`
- `expect(page.getByTestId('daily-xp-bonus')).toContainText('+50')`

**API Verification**:
- POST `/api/daily-challenge/complete` → 200 with `{ completed: true, alreadyCompleted: false, score, correct: 5, total: 5 }`
- `GET /api/daily-challenge/result` → `{ completed: true, date }`
- `GET /api/daily-challenge` (re-fetch) → `alreadyCompleted: true`
- `GET /api/me` → `totalPoints` unchanged (daily XP bonus mechanism separate — confirm whether it modifies UDP.pointsCounted)

**Notes**:
- ✅ Unblocked by `POST /api/daily-challenge/complete` (commit 3ad2542)
- [NEEDS TESTID: daily-result-score, daily-result-correct, daily-xp-bonus]
- **Frontend wiring**: Confirm Daily page UI calls `/complete` endpoint after last answer — if not, [FRONTEND WORK NEEDED]

---

## W-M05-L2-007 — Re-open /daily sau completion → alreadyCompleted=true → UI lock

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @daily @write @serial

**Setup**:
- Login fresh user
- `POST /api/daily-challenge/complete` với `{ score: 100, correctCount: 5 }` to mark completed for today

**Actions**:
1. `page.goto('/daily')`

**Assertions** (UI):
- `expect(page.getByTestId('daily-start-btn')).toBeDisabled()` **hoặc**
- `expect(page.getByTestId('daily-completed-badge')).toBeVisible()`

**API Verification**:
- `GET /api/daily-challenge` → `alreadyCompleted: true`
- `GET /api/daily-challenge/result` → `{ completed: true, ... }`
- Second POST `/complete` → `{ alreadyCompleted: true }` (idempotent)

**Notes**:
- ✅ Unblocked by `/complete` endpoint

---

## W-M05-L2-008 — Streak continuation: pre-seed streak=5, complete daily → streak=6

**Priority**: P0
**Est. runtime**: ~25s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @daily @streak @write @serial

**Setup**:
- `POST /api/admin/test/users/{userId}/set-streak?days=5`
- Ensure daily NOT completed hôm nay

**Actions**:
1. Complete daily challenge 5/5 correct

**API Verification**:
- `GET /api/me/streak` → `currentStreak: 6`, `longestStreak: max(prev, 6)`
- `GET /api/me` → streak display reflects new value

**Notes**:
- Cần verify ai là trigger của streak increment — DailyChallenge hay ranked hay cả hai?
- Open question: streak logic trong StreakService có tự động check daily completion không?

---

## W-M05-L2-009 — Missed day breaks streak: pre-seed streak=10, lastPlayedAt=2 days ago → streak reset to 1

**Priority**: P1
**Est. runtime**: ~25s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @daily @streak @write @serial

**Setup**:
- `set-streak?days=10`
- `set-state` `{ lastPlayedAt: "<2 days ago>" }` — user skipped yesterday

**Actions**:
1. Complete daily today

**API Verification**:
- `GET /api/me/streak` → `currentStreak: 1` (reset vì đã miss 1 day)
- `longestStreak: 10` (unchanged, max-of-history)

**Notes**:
- Verify streak logic: consecutive days required, 1 day gap → reset
- Đọc StreakService để biết exact rules

---

## W-M05-L2-010 — Daily challenge wrong answers tracked: 3/5 correct → score reflects partial

**Priority**: P1
**Est. runtime**: ~25s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @daily @scoring @write @serial

**Setup**:
- Reset completion

**Actions**:
1. Start daily
2. Answer câu 1-3 correct, câu 4-5 wrong
3. Complete

**API Verification**:
- `GET /api/daily-challenge/result` → `{ completed: true, correct: 3, total: 5 }`
- Score đúng per scoring formula (Practice mode formula? hoặc Daily có formula riêng?)

**Notes**:
- Confirm: Daily Challenge dùng scoring formula nào? Practice (base 10/20/30) hay Ranked (base 8/12/18)?
- Đọc code xử lý answer trong daily flow

---

## W-M05-L2-011 — Guest user play daily → start OK, submit unauthed → can't track result

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: no auth (guest)
**Tags**: @happy-path @daily @guest @parallel-safe

**Actions**:
1. `GET /api/daily-challenge` (no auth)
2. `POST /api/daily-challenge/start` (no auth)
3. `GET /api/daily-challenge/result` (no auth)

**API Verification**:
- GET / → 200 với questions
- POST /start → 200 với sessionId
- GET /result → **401 Unauthorized** với `{ error: "Login required to view results" }`

**Notes**:
- Guest có thể play nhưng không save result
- Verify permission rule từ DailyChallengeController line 87-89

---

## W-M05-L2-012 — Mission "complete_daily_challenge" progress incremented sau daily complete

**Priority**: P1
**Est. runtime**: ~25s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @daily @missions @write @serial

**Setup**:
- `set-mission-state` với mission `{ missionType: "COMPLETE_DAILY_CHALLENGE", progress: 0, completed: false }`

**Actions**:
1. Complete daily challenge

**API Verification**:
- `GET /api/me/daily-missions` → mission "COMPLETE_DAILY_CHALLENGE": `progress: 1, completed: true`
- Bonus XP applied nếu có

**Notes**:
- Mission definition từ `DailyMissionService.java:40`: `new MissionDef("complete_daily_challenge", ...)`
- Mission trigger có thể cần wire thêm vào markCompleted flow — frontend or backend must increment "COMPLETE_DAILY_CHALLENGE" mission progress when `/complete` fires. Verify via integration test.

---

## NEEDS TESTID Summary (W-M05 L2)

| Element | Suggested testid | File |
|---------|-----------------|------|
| Daily page | `daily-page` | pages/Daily.tsx |
| Countdown timer | `daily-countdown-timer` | pages/Daily.tsx |
| Start button | `daily-start-btn` | pages/Daily.tsx |
| Reward display | `daily-reward-display` | pages/Daily.tsx |
| Completed badge | `daily-completed-badge` | pages/Daily.tsx |
| Result score | `daily-result-score` | pages/Daily.tsx or Quiz.tsx |
| Result correct count | `daily-result-correct` | pages/Daily.tsx |
| XP bonus display | `daily-xp-bonus` | pages/Daily.tsx |

---

## NOT IMPLEMENTED / BLOCKERS

| # | Issue | Impact | Status |
|---|-------|--------|--------|
| 1 | ~~`markCompleted()` chưa wired~~ | ~~L2-006/007/008/012 blocked~~ | ✅ FIXED: `POST /api/daily-challenge/complete` endpoint added (commit 3ad2542) |
| 2 | Admin endpoint clear daily completion | L2-006/007 cần reset giữa tests — dùng ephemeral user hoặc thêm `DELETE /api/admin/test/daily/complete?userId=X` | Workaround: ephemeral user |
| 3 | Daily scoring formula source | L2-010 — confirm formula nào | Code read needed |
| 4 | Frontend wiring to POST /complete | L2-006 end-to-end | Frontend must call `/complete` after last answer — verify Daily.tsx |

---

## Open Questions

1. Daily Challenge dùng scoring formula nào (Practice hay Ranked)?
2. `markCompleted` chưa được gọi — frontend có track completion qua local state không? Nếu có, reload page sẽ lose completion?
3. Streak increment logic: trigger bởi Daily, Ranked, hay cả hai?
4. Daily XP bonus (+50) được cộng vào `UserDailyProgress.pointsCounted` hay separate field?
5. Daily questions selection algorithm: hash-based fixed cho mỗi ngày — verify reproducible?

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 3s |
| L2-002 | 4s |
| L2-003 | 3s |
| L2-004 | 5s |
| L2-005 | 5s |
| L2-006 | 25s ⚠️ blocked |
| L2-007 | 6s ⚠️ blocked |
| L2-008 | 25s ⚠️ blocked |
| L2-009 | 25s |
| L2-010 | 25s |
| L2-011 | 5s |
| L2-012 | 25s ⚠️ blocked dependency |
| **Total** | **~156s (~2.6 min)** | 3-4 cases blocked |

Parallel-safe: 4 cases (L2-001, L2-002, L2-004, L2-011).

---

## Summary

- **12 cases** total (within 12-14 estimate)
- **P0**: 5 | **P1**: 7 | **P2**: 0
- **BLOCKED**: 3-4 cases phụ thuộc `markCompleted` production wiring
- **NEEDS TESTID**: 8 elements
- **Critical finding**: Production gap ở completion tracking — cần fix trước khi chạy L2
- **Runtime**: ~2.6 min serial
