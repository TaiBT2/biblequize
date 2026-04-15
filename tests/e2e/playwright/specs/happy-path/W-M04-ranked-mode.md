# W-M04 — Ranked Mode (L2 Happy Path)

**Routes:** `/ranked`, `/quiz?mode=ranked`
**Spec ref:** SPEC_USER §5.2, §4.4
**Module priority:** Tier 1 (Critical business logic — scoring formula + tier bump + leaderboard)

---

## Scoring Formula Reference

Từ `ScoringService.calculate()`:

```
baseScore = { easy: 8, medium: 12, hard: 18 }
speedBonus = floor(baseScore × 0.5 × speedRatio²)
    where speedRatio = max(0, (30000 - elapsedMs) / 30000)
subtotal = (baseScore + speedBonus) × comboPercent / 100
    where comboPercent = 150 if streak ≥10, 120 if streak ≥5, else 100
if isDailyFirst: subtotal × 2
earned = round(subtotal × tierXpMultiplier × (xpSurge ? 1.5 : 1))
```

**Tier thresholds** (RankTier enum): 0 → 1k → 5k → 15k → 40k → 100k

**Daily limits**: MAX_ENERGY=100, DAILY_QUESTION_CAP=100

---

## Test User Assignment

- All L2 Ranked tests dùng `test3@dev.local` (tier 3, ~8000 pts) làm base
- `beforeEach` set-state reset livesRemaining=100, questionsCounted=0, pointsCounted=0
- Tier-bump tests dùng test user tương ứng ngưỡng cần test

---

## Shared beforeEach pattern

```typescript
test.beforeEach(async ({ request }) => {
  const userId = await getUserId('test3@dev.local')
  await request.post(`/api/admin/test/users/${userId}/set-state`, {
    data: {
      livesRemaining: 100,
      questionsCounted: 0,
    }
  })
})
```

---

## W-M04-L2-001 — Ranked page hiển thị đúng tier, energy, questionsCounted

**Priority**: P0
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @ranked @critical @serial

**Setup**:
- `POST /api/admin/test/users/{userId}/set-state`: `{ livesRemaining: 100, questionsCounted: 0 }`
- `POST /api/admin/test/users/{userId}/set-tier?tierLevel=3` (ensure tier 3)

**Preconditions**:
- User ở tier 3, energy=100, questionsCounted=0

**Actions**:
1. `page.goto('/ranked')`
2. `page.waitForSelector('[data-testid="ranked-page"]')`

**Assertions** (UI):
- `expect(page.getByTestId('ranked-tier-badge')).toContainText('Môn Đồ')` (tier 3)
- `expect(page.getByTestId('ranked-energy-display')).toContainText('100')`
- `expect(page.getByTestId('ranked-questions-counted')).toContainText('0/100')`
- `expect(page.getByTestId('ranked-start-btn')).toBeEnabled()`

**API Verification**:
- `GET /api/me/ranked-status` → `{ livesRemaining: 100, questionsCounted: 0, cap: 100 }`
- `GET /api/me/tier` → tier key = "disciple"

**Cleanup**: none (read-only UI, set-state đã reset)

**Notes**:
- [NEEDS TESTID: ranked-page, ranked-tier-badge, ranked-energy-display, ranked-questions-counted, ranked-start-btn]

---

## W-M04-L2-002 — Start ranked session → POST /api/ranked/sessions trả về sessionId + currentBook

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @ranked @critical @write @serial

**Setup**:
- `POST set-state`: `{ livesRemaining: 100, questionsCounted: 0 }`

**Preconditions**:
- Ranked page visible, start button enabled

**Actions**:
1. `page.goto('/ranked')`
2. `page.getByTestId('ranked-start-btn').click()`
3. `page.waitForURL(/\/quiz/)`
4. `page.waitForSelector('[data-testid="quiz-question-text"]')`

**Assertions** (UI):
- `expect(page).toHaveURL(/\/quiz/)`
- `expect(page.getByTestId('quiz-question-text')).toBeVisible()`
- `expect(page.getByTestId('quiz-timer')).toBeVisible()` — 30s countdown

**API Verification**:
- Intercept POST `/api/ranked/sessions` → response có `sessionId` (format: `ranked-{timestamp}`), `currentBook`, `bookProgress`
- `sessionId` stored trong session store (verify via `page.evaluate` localStorage hoặc sessionStorage)

**Cleanup**:
- `POST set-state` reset (afterEach)

**Notes**:
- [NEEDS TESTID: quiz-question-text, quiz-timer]
- Session stored in Redis (TTL 26h) — không cần cleanup Redis, TTL tự xoá

---

## W-M04-L2-003 — Answer 1 câu easy đúng → +8 base XP (no combo, no daily first bonus, tier 3 multiplier)

**Priority**: P0
**Est. runtime**: ~10s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @ranked @scoring @write @serial

**Setup**:
- `POST set-state`: `{ livesRemaining: 100, questionsCounted: 1 }` — force questionsCounted=1 để NOT daily first (avoid ×2 bonus)
- Query `GET /api/admin/test/users/{userId}/preview-questions?count=1&difficulty=easy` để biết correct answer index
- Lưu `pointsBefore = (GET /api/me).totalPoints`

**Preconditions**:
- Ranked session fresh, easy question đầu tiên
- `isDailyFirst = false` (questionsCounted đã > 0)

**Actions**:
1. `page.goto('/ranked')`
2. `page.getByTestId('ranked-start-btn').click()`
3. `page.waitForSelector('[data-testid="quiz-question-text"]')`
4. **Wait slowly** (~20s) để giảm speed bonus về ~0 — elapsedMs ≈ 20000 → speedRatio ≈ 0.33 → speedBonus = floor(8 × 0.5 × 0.11) = 0
5. `page.getByTestId('quiz-answer-{correctIdx}').click()`
6. Wait for answer feedback

**Assertions** (UI):
- `expect(page.getByTestId('quiz-answer-feedback')).toContainText(/correct|đúng/i)`
- `expect(page.getByTestId('quiz-xp-gained')).toContainText(/\+\d+/)`

**API Verification**:
- `GET /api/me` → `totalPoints` = `pointsBefore + (8 × tier3Multiplier)` (tier 3 multiplier từ TierRewardsConfig — check exact value trong test)
- `GET /api/me/ranked-status` → `pointsToday` tăng đúng delta, `questionsCounted = 2`
- Formula verification: `delta === Math.round(8 × tierRewardsConfig.getRewards(3).xpMultiplier())`

**Cleanup**:
- `POST set-state` reset

**Notes**:
- Speed bonus ≈ 0 để simplify formula verification
- Tier multiplier cần đọc `TierRewardsConfig.getRewards(3).xpMultiplier()` — reference trong spec
- [NEEDS TESTID: quiz-answer-0..3, quiz-answer-feedback, quiz-xp-gained]

---

## W-M04-L2-004 — Answer medium đúng → +12 base XP verify

**Priority**: P1
**Est. runtime**: ~10s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @ranked @scoring @write @serial

**Setup**:
- `POST set-state`: `{ livesRemaining: 100, questionsCounted: 1 }`
- Preview medium question để biết correct answer

**Actions**:
1. Start ranked session
2. Filter/force medium question (qua difficulty param nếu có, hoặc skip đến medium question)
3. Answer chậm (~20s elapsed) để speedBonus ≈ 0
4. Submit correct answer

**API Verification**:
- `GET /api/me` → delta = `Math.round(12 × tier3Multiplier)`

**Notes**:
- `difficulty=medium` query param — confirm backend support
- [NOT IMPLEMENTED?: nếu không có way force medium question, test này skip hoặc giảm priority xuống P2]

---

## W-M04-L2-005 — Answer hard đúng → +18 base XP verify

**Priority**: P1
**Est. runtime**: ~10s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @ranked @scoring @write @serial

**Setup**:
- `POST set-state`: `{ livesRemaining: 100, questionsCounted: 1 }`

**Actions**: (tương tự L2-004 nhưng với hard question)

**API Verification**:
- `GET /api/me` → delta = `Math.round(18 × tier3Multiplier)`

---

## W-M04-L2-006 — Speed bonus: trả lời nhanh (~3s) → verify speedBonus formula

**Priority**: P0
**Est. runtime**: ~8s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @ranked @scoring @write @serial

**Setup**:
- `POST set-state`: `{ livesRemaining: 100, questionsCounted: 1 }`
- Preview easy question

**Preconditions**:
- isDailyFirst=false (đã set questionsCounted=1)

**Actions**:
1. Start ranked session
2. `page.waitForSelector('[data-testid="quiz-answer-0"]')`
3. **Click answer ngay lập tức** (elapsed ~3000ms)
4. Wait feedback

**Expected formula** (elapsedMs=3000):
```
speedRatio = (30000 - 3000) / 30000 = 0.9
speedBonus = floor(8 × 0.5 × 0.81) = floor(3.24) = 3
subtotal = 8 + 3 = 11
no combo (streak=1)
not daily first
earned = round(11 × tier3Multiplier)
```

**API Verification**:
- `GET /api/me` → delta = `Math.round(11 × tier3Multiplier)` (tolerance ±2 XP vì elapsed không chính xác 3000ms)

**Notes**:
- Tolerance cần thiết vì Playwright click latency không deterministic
- Test verify speedBonus > 0 (không phải verify exact value)

---

## W-M04-L2-007 — Combo multiplier: 5-streak → ×1.2

**Priority**: P0
**Est. runtime**: ~30s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @ranked @scoring @write @serial

**Setup**:
- `POST set-state`: `{ livesRemaining: 100, questionsCounted: 5 }` (not daily first)
- Preview 5 easy questions

**Actions**:
1. Start session
2. Answer 5 câu easy liên tiếp đúng, mỗi câu chậm (~20s → speedBonus=0)
3. Capture XP sau mỗi câu qua `GET /api/me`

**API Verification**:
- Câu 1-4: mỗi câu earned = `round(8 × tier3Multiplier)` (comboPercent=100)
- Câu 5: earned = `round((8 × 120 / 100) × tier3Multiplier)` = `round(9.6 × tier3Multiplier)`
- Cumulative `totalPoints` = `pointsBefore + 4 × round(8 × M) + 1 × round(9.6 × M)`

**Cleanup**:
- `POST set-state` reset

**Notes**:
- Test dài runtime (~30s) do 5 câu × 6s click delay
- `currentStreak` trong Redis Progress — verify qua `GET /api/me/ranked-status` nếu có expose

---

## W-M04-L2-008 — Combo multiplier: 10-streak → ×1.5

**Priority**: P1
**Est. runtime**: ~60s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @ranked @scoring @write @serial

**Setup**:
- `POST set-state`: `{ livesRemaining: 100, questionsCounted: 10 }`
- Preview 10 easy questions

**Actions**:
1. Start session
2. Answer 10 câu easy đúng liên tiếp

**API Verification**:
- Câu 10: earned = `round((8 × 150 / 100) × tier3Multiplier)` = `round(12 × tier3Multiplier)`

**Notes**:
- Test dài, có thể chia thành 2 tests nhỏ hơn nếu runtime quá cao
- Consider: dùng direct API POST `/api/ranked/sessions/{id}/answer` thay vì UI click để giảm runtime

---

## W-M04-L2-009 — Daily first answer bonus → ×2

**Priority**: P0
**Est. runtime**: ~10s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @ranked @scoring @write @serial

**Setup**:
- `POST set-state`: `{ livesRemaining: 100, questionsCounted: 0 }` — ensure first answer today
- Preview 1 easy question

**Preconditions**:
- `isDailyFirst = true` (questionsCounted=0 AND chưa play ranked hôm nay)

**Actions**:
1. Start ranked session
2. Answer chậm (~20s → speedBonus=0) với correct answer

**Expected formula**:
```
baseScore = 8, speedBonus = 0, comboPercent = 100
subtotal = 8
isDailyFirst → subtotal × 2 = 16
earned = round(16 × tier3Multiplier)
```

**API Verification**:
- `GET /api/me` → delta = `Math.round(16 × tier3Multiplier)` (2× expected base)

**Cleanup**:
- `POST set-state` reset

**Notes**:
- Daily first logic: server check `UserDailyProgress.pointsCounted == 0` và `questionsCounted == 0` cho hôm nay
- Đọc code logic chính xác trong RankedController để verify field check

---

## W-M04-L2-010 — Wrong answer → streak reset, -5 energy, no XP gained

**Priority**: P0
**Est. runtime**: ~10s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @ranked @scoring @write @serial

**Setup**:
- `POST set-state`: `{ livesRemaining: 100, questionsCounted: 1 }`
- Preview 1 easy question → biết wrong answer index (any index ≠ correct)
- Lưu `pointsBefore = (GET /api/me).totalPoints`

**Actions**:
1. Start session
2. Click wrong answer
3. Wait feedback

**Assertions** (UI):
- `expect(page.getByTestId('quiz-answer-feedback')).toContainText(/wrong|sai/i)`

**API Verification**:
- `GET /api/me` → `totalPoints === pointsBefore` (no change)
- `GET /api/me/ranked-status` → `livesRemaining === 95` (-5)
- `GET /api/me/ranked-status` → `questionsCounted === 2` (vẫn +1 dù wrong)
- Session progress `currentStreak === 0` (reset)

**Cleanup**:
- `POST set-state` reset

**Notes**:
- Energy penalty -5 per wrong — confirm trong RankedController code
- Streak reset to 0 — verify via next-answer combo không áp dụng

---

## W-M04-L2-011 — Energy depletion: lives=0 → submit bị chặn

**Priority**: P1
**Est. runtime**: ~6s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @ranked @energy @write @serial

**Setup**:
- `POST set-state`: `{ livesRemaining: 0, questionsCounted: 50 }` — pre-seed lives=0 (không cần chạy 20 câu wrong)

**Preconditions**:
- User có lives=0, questionsCounted < cap

**Actions**:
1. `page.goto('/ranked')`

**Assertions** (UI):
- `expect(page.getByTestId('ranked-energy-display')).toContainText('0')`
- `expect(page.getByTestId('ranked-start-btn')).toBeDisabled()` **hoặc**
- `expect(page.getByTestId('ranked-no-energy-msg')).toBeVisible()` nếu có message

**API Verification**:
- `GET /api/me/ranked-status` → `{ livesRemaining: 0 }`
- Nếu user cố POST `/api/ranked/sessions/{id}/answer` → response 403 hoặc 409

**Cleanup**:
- `POST set-state` reset lives=100

**Notes**:
- Confirm UI behavior: disable start btn hay hiện message
- [NEEDS TESTID: ranked-no-energy-msg] (nếu có)
- Alternatively có energy regen display (hiển thị thời gian tới lần regen kế tiếp)

---

## W-M04-L2-012 — Daily question cap: questionsCounted=100 → không play được

**Priority**: P1
**Est. runtime**: ~6s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @ranked @energy @write @serial

**Setup**:
- `POST set-state`: `{ livesRemaining: 100, questionsCounted: 100 }` — pre-seed at daily cap

**Preconditions**:
- User đã đạt daily cap (100 questions today)

**Actions**:
1. `page.goto('/ranked')`

**Assertions** (UI):
- `expect(page.getByTestId('ranked-questions-counted')).toContainText('100/100')`
- `expect(page.getByTestId('ranked-start-btn')).toBeDisabled()` **hoặc**
- `expect(page.getByTestId('ranked-cap-reached-msg')).toBeVisible()`

**API Verification**:
- `GET /api/me/ranked-status` → `{ questionsCounted: 100, cap: 100 }`
- POST `/api/ranked/sessions/{id}/answer` → 409 Conflict (daily cap reached)

**Cleanup**:
- `POST set-state` reset

**Notes**:
- [NEEDS TESTID: ranked-cap-reached-msg]
- Daily cap = DAILY_QUESTION_CAP = 100 (từ RankedController constants)

---

## W-M04-L2-013 — Tier bump: pre-seed ngưỡng 4999 → 1 correct easy → tier 3 (Môn Đồ)

**Priority**: P0
**Est. runtime**: ~10s
**Auth**: fresh login as test2@dev.local (tier 2 user)
**Tags**: @happy-path @ranked @tier-bump @write @serial

**Setup**:
- `POST set-state`: `{ livesRemaining: 100, questionsCounted: 5 }` (not daily first)
- Set `totalPoints` via set-state hoặc direct DB: **Cần endpoint `set-total-points` hoặc `set-state` field mới**
  - **[NOT IMPLEMENTED]**: AdminTestController.SetStateRequest hiện KHÔNG có field `totalPoints`. Cần thêm field này hoặc dùng endpoint khác (set-tier?)
  - Workaround: Dùng `POST /api/admin/test/users/{userId}/set-tier?tierLevel=2` nếu endpoint này có set totalPoints
- Goal: user ở totalPoints = 4999 (ngưỡng tier 3 = 5000, chỉ cần 1 XP để bump)

**Preconditions**:
- User totalPoints = 4999, currentTier = MON_DO precursor (NGUOI_TIM_KIEM = tier 2)

**Actions**:
1. `page.goto('/ranked')`
2. Start session
3. Answer 1 easy correct → earned ≥ 1 XP → totalPoints ≥ 5000

**API Verification**:
- `GET /api/me` → `totalPoints >= 5000`
- `GET /api/me/tier` → `{ key: "disciple" }` (tier 3 Môn Đồ)
- `GET /api/me/tier-progress` → tier-up event (optional, nếu có audit log)

**Cleanup**:
- `POST set-state` reset totalPoints về giá trị ban đầu

**Notes**:
- **[NOT IMPLEMENTED]**: Cần AdminTestController endpoint hoặc field để set `totalPoints` chính xác. Đề xuất: thêm `totalPoints` vào `SetStateRequest` (validation `@Min(0)`, apply vào `User.totalPoints`)
- Nếu không implement được, test này bị BLOCKED → đề xuất Phase 4a bonus work

---

## W-M04-L2-014 — Session progress sync: sync-progress endpoint updates UserDailyProgress

**Priority**: P1
**Est. runtime**: ~8s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @ranked @persistence @write @serial

**Setup**:
- `POST set-state`: `{ livesRemaining: 100, questionsCounted: 0 }`

**Actions**:
1. `page.goto('/ranked')` → start session
2. Answer 3 easy correct
3. Wait for `useRankedDataSync` hook to fire POST `/api/ranked/sync-progress` (interval-based)
4. Or manually trigger: navigate away `/` → back to `/ranked`

**API Verification** (sau khi sync):
- `GET /api/me/ranked-status` (hoặc direct DB query via admin endpoint):
  - `livesRemaining === 100` (no wrong)
  - `questionsCounted === 3`
  - `pointsCounted > 0` (tăng đúng scoring formula)
- Reload page → data persisted qua refresh

**Cleanup**:
- `POST set-state` reset

**Notes**:
- `useRankedDataSync` hook tự động sync mỗi N seconds — verify interval trong code
- Test persistence: session store (Redis) vs DB (UserDailyProgress) sync đúng

---

## NEEDS TESTID Summary (W-M04 L2)

| Element | Suggested testid | File |
|---------|-----------------|------|
| Ranked page wrapper | `ranked-page` | pages/Ranked.tsx |
| Tier badge | `ranked-tier-badge` | pages/Ranked.tsx |
| Energy display | `ranked-energy-display` | pages/Ranked.tsx |
| Questions counted | `ranked-questions-counted` | pages/Ranked.tsx |
| Start button | `ranked-start-btn` | pages/Ranked.tsx |
| No energy message | `ranked-no-energy-msg` | pages/Ranked.tsx |
| Cap reached message | `ranked-cap-reached-msg` | pages/Ranked.tsx |
| Quiz question text | `quiz-question-text` | pages/Quiz.tsx |
| Quiz timer | `quiz-timer` | pages/Quiz.tsx |
| Answer option 0-3 | `quiz-answer-0..3` | pages/Quiz.tsx |
| Answer feedback | `quiz-answer-feedback` | pages/Quiz.tsx |
| XP gained display | `quiz-xp-gained` | pages/Quiz.tsx |

---

## NOT IMPLEMENTED / BLOCKERS

| Feature | Module | Impact | Suggested fix |
|---------|--------|--------|---------------|
| `SetStateRequest.totalPoints` field | AdminTestController | W-M04-L2-013 (tier bump) BLOCKED | Thêm field `totalPoints @Min(0)` vào DTO + apply vào `User.totalPoints` |
| Force difficulty filter trong preview-questions | AdminTestController | W-M04-L2-004/005 phụ thuộc | Confirm `preview-questions?difficulty=medium|hard` hoạt động |
| Expose `currentStreak` qua `/api/me/ranked-status` | RankedController | Combo verification trong L2-007/008 dùng indirect | Optional — có thể dùng formula delta để verify gián tiếp |

---

## Open Questions (cần bui clarify trước khi convert sang Playwright code)

1. **Tier XP multiplier values**: `TierRewardsConfig.getRewards(tierLevel).xpMultiplier()` cho tier 1-6 = bao nhiêu? Cần đọc config để hardcode vào test assertions, hoặc fetch từ `/api/tier-rewards` endpoint (nếu có).

2. **Wrong answer energy penalty**: -5 per wrong có chính xác không? Confirm trong RankedController `submitRankedAnswer` logic.

3. **Daily first bonus trigger**: server check `pointsToday == 0 && questionsCounted == 0` — chính xác là điều kiện nào? Nếu dùng set-state đặt `questionsCounted = 1` thì có disable daily first không? Cần đọc RankedController.

4. **Session progress sync interval**: `useRankedDataSync` sync mỗi bao lâu? Test L2-014 cần biết interval để wait đúng.

5. **Quiz frontend tự submit hay user click Next?**: Sau khi chọn answer, UI có tự submit hay user phải click "Next"? Impacts test actions flow.

---

## Runtime Estimate

| Case | Runtime | Note |
|------|---------|------|
| L2-001 | 5s | Read-only |
| L2-002 | 6s | Start session |
| L2-003 | 10s | 1 answer with slow wait |
| L2-004 | 10s | |
| L2-005 | 10s | |
| L2-006 | 8s | Fast click |
| L2-007 | 30s | 5 answers |
| L2-008 | 60s | 10 answers |
| L2-009 | 10s | |
| L2-010 | 10s | Wrong answer |
| L2-011 | 6s | Pre-seed lives=0 |
| L2-012 | 6s | Pre-seed cap |
| L2-013 | 10s | Tier bump (BLOCKED) |
| L2-014 | 8s | Sync progress |
| **Total** | **~189s** (~3 min) | |

Parallel-safe: 0 (all @serial vì có write). Estimated full runtime serial: **~3 min** cho 14 cases.

---

## Summary

- **14 cases** total (12 viable + 2 phụ thuộc NOT IMPLEMENTED)
- **P0**: 8 cases — scoring formula critical path
- **P1**: 6 cases — edge cases + persistence
- **[NEEDS TESTID]**: 12 elements (ranked page + quiz page)
- **[NOT IMPLEMENTED]**: 1 blocker (set totalPoints for tier bump test)
- **Estimated runtime**: ~3 minutes serial
