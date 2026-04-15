# W-M03 — Practice Mode (L2 Happy Path)

**Routes:** `/practice`, `/quiz`, `/review`
**Spec ref:** SPEC_USER §5.1
**Module priority:** Tier 1 (core game loop — session creation, scoring, review, retry)

---

## ⚠️ Scoring Formula khác Ranked!

Từ `SessionService.computeScore()` (KHÔNG dùng ScoringService):

```
baseScore = { easy: 10, medium: 20, hard: 30 }       ← KHÁC RANKED (8/12/18)
timeLeftSec = max(0, 30 - elapsedSec)
timeBonus = timeLeftSec / 2                          ← max 15 pts
perfectBonus = timeLeftSec >= 25 ? 5 : 0             ← answer trong < 5s
difficultyMult = { easy: 1.0, medium: 1.2, hard: 1.5 }
earned = floor((base + timeBonus + perfectBonus) × difficultyMult)
```

**Quan trọng**:
- ❌ KHÔNG có combo multiplier
- ❌ KHÔNG có daily first bonus
- ❌ KHÔNG có tier XP multiplier
- ❌ KHÔNG cộng vào `User.totalPoints` — Practice không contribute tier progression
- ✅ Score chỉ lưu trong `QuizSession.score` và `QuizSessionQuestion.scoreEarned`
- ✅ Answer lưu vào `UserQuestionHistory` — ảnh hưởng smart question selector lần sau
- ✅ Elapsed time cap: `Math.min(clientElapsedMs, 35000)` — không cheat được

---

## Test User Assignment

- Practice L2 dùng `test3@dev.local` (tier 3 — để smart selector pick questions phù hợp)
- `beforeEach`: reset question history nếu cần (dùng `POST /api/admin/test/users/{id}/reset-history`)

---

## W-M03-L2-001 — Create session với config đầy đủ → POST /api/sessions trả về sessionId + questions

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @practice @critical @write @serial

**Setup**:
- `POST /api/admin/test/users/{userId}/reset-history` — clear question history để smart selector phong phú

**Preconditions**:
- Practice page visible
- At least 10 easy questions active trong DB

**Actions**:
1. `page.goto('/practice')`
2. Chọn difficulty "Dễ" (click chip)
3. Chọn count 10 (click button)
4. Toggle showExplanation ON (default)
5. `page.getByTestId('practice-start-btn').click()`
6. `page.waitForURL(/\/quiz/)`

**Assertions** (UI):
- `expect(page).toHaveURL(/\/quiz/)`
- `expect(page.getByTestId('quiz-question-text')).toBeVisible()`
- `expect(page.getByTestId('quiz-progress')).toContainText('1/10')`

**API Verification**:
- Intercept POST `/api/sessions`: request body `{ mode: "practice", difficulty: "easy", questionCount: 10, showExplanation: true, book: "" }`
- Response có `sessionId` (UUID format), `questions` array length = 10
- Each question object có `id`, `text`, `options` (4 items), NO `correctAnswer` (không leak đáp án)
- `GET /api/sessions/{id}` → `mode: "practice"`, `status: "in_progress"`, `totalQuestions: 10`, `correctAnswers: 0`, `score: 0`

**Cleanup**:
- `POST /api/admin/test/users/{userId}/reset-history` (session tự abandon sau TTL, không cần DELETE)

**Notes**:
- [NEEDS TESTID: practice-start-btn, practice-difficulty-chip-{key}, practice-count-btn-{n}, quiz-progress]
- Correct answer KHÔNG có trong response GET /api/sessions (security) — verify

---

## W-M03-L2-002 — Answer easy correct trong 5s → verify scoring formula (perfect bonus)

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @practice @scoring @write @serial

**Setup**:
- `POST /api/admin/test/users/{userId}/reset-history`
- Create session via API preview để biết correct answer index

**Expected formula** (easy, elapsed~3000ms):
```
base = 10, timeLeftSec = 27, timeBonus = 13, perfectBonus = 5
subtotal = (10 + 13 + 5) × 1.0 = 28
```

**Actions**:
1. Start practice session (easy, count 1)
2. Click correct answer trong ~3s (< 5s để trigger perfect bonus)

**Assertions** (UI):
- `expect(page.getByTestId('quiz-answer-feedback')).toContainText(/correct|đúng/i)`
- `expect(page.getByTestId('quiz-score-delta')).toContainText(/\+2[0-9]/)` — delta khoảng 20-35 (tolerance cho click latency)

**API Verification**:
- `GET /api/sessions/{sessionId}` → `score: 28` (±5 tolerance, depending on exact elapsedMs)
- `GET /api/sessions/{sessionId}` → `correctAnswers: 1`
- `GET /api/me` → `totalPoints` **KHÔNG THAY ĐỔI** (practice không cộng totalPoints)

**Notes**:
- Tolerance ±5 vì click latency — elapsedMs không deterministic
- [NEEDS TESTID: quiz-score-delta]
- **Critical assertion**: `totalPoints` không đổi — đây là invariant chính của Practice mode

---

## W-M03-L2-003 — Answer hard correct trong 3s → verify difficulty multiplier 1.5x + perfect bonus

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @practice @scoring @write @serial

**Setup**:
- `POST reset-history`

**Expected formula** (hard, elapsed~3000ms):
```
base = 30, timeLeftSec = 27, timeBonus = 13, perfectBonus = 5
subtotal = (30 + 13 + 5) × 1.5 = 72
```

**Actions**:
1. Start practice with `difficulty: hard, count: 1`
2. Click correct answer trong ~3s

**API Verification**:
- `GET /api/sessions/{sessionId}` → `score` ≈ 72 (±8 tolerance)
- Hard multiplier 1.5x verified

---

## W-M03-L2-004 — Answer medium correct trong 10s (no perfect bonus) → verify scoring

**Priority**: P1
**Est. runtime**: ~12s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @practice @scoring @write @serial

**Expected formula** (medium, elapsed~10000ms):
```
base = 20, timeLeftSec = 20, timeBonus = 10, perfectBonus = 0 (>= 5s)
subtotal = (20 + 10 + 0) × 1.2 = 36
```

**Actions**:
1. Start practice with medium/count 1
2. **Wait ~10s** rồi click correct answer

**API Verification**:
- `GET /api/sessions/{sessionId}` → `score` ≈ 36 (±4)
- `perfectBonus` không apply (wait > 5s)

---

## W-M03-L2-005 — Answer wrong → 0 XP, correctAnswers không tăng, UserQuestionHistory ghi lại

**Priority**: P0
**Est. runtime**: ~6s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @practice @write @serial

**Setup**:
- `POST reset-history`
- Preview 1 easy question → biết wrong answer index

**Actions**:
1. Start practice easy/count 1
2. Click wrong answer

**Assertions** (UI):
- `expect(page.getByTestId('quiz-answer-feedback')).toContainText(/wrong|sai/i)`
- Nếu showExplanation=true → `expect(page.getByTestId('quiz-explanation')).toBeVisible()`

**API Verification**:
- `GET /api/sessions/{sessionId}` → `score: 0`, `correctAnswers: 0`
- `POST /api/admin/test/users/{userId}/question-history-count` (nếu có endpoint) HOẶC query indirectly qua `GET /api/me/weaknesses` → hard question phải xuất hiện
- **Wrong answer vẫn được record trong UserQuestionHistory** — verify để smart selector pick lại câu này

**Notes**:
- [NEEDS TESTID: quiz-explanation]
- [POTENTIAL NOT IMPLEMENTED]: endpoint để verify question history count — có thể dùng indirect check

---

## W-M03-L2-006 — Elapsed time cap: submit với clientElapsedMs = 999999 → server cap 35000

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @practice @security @write @serial

**Rationale**: FIX #6/#7 — server cap elapsed time để chống cheat speed bonus.

**Actions**:
1. Start session via API
2. Direct POST `/api/sessions/{id}/answer` với body:
   ```json
   { "questionId": "...", "answer": "correct_idx", "elapsedMs": 999999 }
   ```

**API Verification**:
- Response 200 OK
- `GET /api/sessions/{sessionId}` → `score` reflecting `elapsedMs=35000` (full time expired)
  - `timeLeftSec = max(0, 30 - 35) = 0` → `timeBonus = 0, perfectBonus = 0`
  - `earned = (10 + 0 + 0) × 1.0 = 10` cho easy
- Score KHÔNG reflect speed bonus (attacker không được bonus)

**Actions (inverse)**:
3. Start another session
4. POST với `elapsedMs: -5000` (negative)
5. Server cap ở 0 → timeLeftSec = 30 → max speed bonus → full earn
   - Tuy nhiên `Math.max(clientElapsedMs, 0)` → elapsedMs = 0 → đây là behavior designed

**Notes**:
- Test backend invariant: `safedElapsedMs = Math.min(Math.max(clientElapsedMs, 0), 35000)`
- Không cần UI — pure API test, nhưng vẫn auth qua Playwright context

---

## W-M03-L2-007 — Complete full 5-question session → score cumulative, session marked completed

**Priority**: P0
**Est. runtime**: ~25s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @practice @write @serial

**Setup**:
- `POST reset-history`
- Preview 5 easy questions

**Actions**:
1. Start practice easy/count 5
2. Answer 5 correct (slow ~15s each để predictable scoring)
3. Wait for redirect to results/review

**Expected total score** (5 easy correct, ~15s each):
```
Per question: base=10, timeLeftSec=15, timeBonus=7, perfectBonus=0, mult=1.0
Per earned = (10 + 7 + 0) × 1.0 = 17
Total = 17 × 5 = 85
```

**API Verification**:
- `GET /api/sessions/{sessionId}` → `score ≈ 85 (±10 tolerance)`, `correctAnswers: 5`, `status: "completed"`
- `GET /api/me` → `totalPoints` unchanged (practice)

**Notes**:
- Confirm session auto-moves to `completed` status khi answer last question, hay cần explicit end call

---

## W-M03-L2-008 — Review mode: GET /api/sessions/{id}/review trả về breakdown per difficulty

**Priority**: P1
**Est. runtime**: ~8s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @practice @review @serial

**Setup**:
- Complete 1 session với 3 câu (mix easy/medium/hard nếu có thể)

**Actions**:
1. `page.goto('/review?sessionId={id}')` (hoặc navigate từ results screen)
2. `page.waitForSelector('[data-testid="review-page"]')`

**Assertions** (UI):
- `expect(page.getByTestId('review-page')).toBeVisible()`
- `expect(page.getByTestId('review-total-correct')).toBeVisible()`
- `expect(page.getByTestId('review-question-item')).toHaveCount(3)` — mỗi câu 1 item
- Each review item có text, user answer, correct answer, explanation

**API Verification**:
- `GET /api/sessions/{sessionId}/review` → response có:
  - `review[]` array với length = số câu đã answer
  - Per item: `questionText, userAnswer, correctAnswer, isCorrect, scoreEarned, explanation, difficulty`
  - Breakdown `easy/medium/hard` với `{correct, total, score}`
  - `totalScore`, `totalCorrect`, `totalQuestions`, `totalTime`

**Notes**:
- [NEEDS TESTID: review-page, review-total-correct, review-question-item]
- Review endpoint phải expose correct answer + explanation (OK vì sau khi complete)

---

## W-M03-L2-009 — Retry session: POST /api/sessions/{id}/retry → new session với same config

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @practice @write @serial

**Setup**:
- Create + complete 1 session với `{ difficulty: "medium", questionCount: 5, showExplanation: false }`

**Actions**:
1. `page.goto('/review?sessionId={originalId}')`
2. `page.getByTestId('review-retry-btn').click()`
3. `page.waitForURL(/\/quiz/)`

**Assertions** (UI):
- URL contains new sessionId (khác original)

**API Verification**:
- Intercept POST `/api/sessions/{originalId}/retry` → response `{ newSessionId, originalSessionId }`
- Status 201 Created
- `GET /api/sessions/{newSessionId}` → `mode: "practice"`, parsed config matches original (`difficulty: medium, questionCount: 5, showExplanation: false`)
- `newSessionId !== originalSessionId`

**Notes**:
- [NEEDS TESTID: review-retry-btn]
- Retry endpoint returns 201 Created (không phải 200 OK)

---

## W-M03-L2-010 — Retry session KHÁC USER → 403 Forbidden

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local (try retry user4's session)
**Tags**: @happy-path @practice @security @write @serial

**Setup**:
- Create session bởi test4@dev.local, note sessionId
- Login test3@dev.local

**Actions**:
1. POST `/api/sessions/{test4_sessionId}/retry` với test3 auth

**API Verification**:
- Response status: **403 Forbidden**
- Response body: `{ "error": "Session does not belong to this user" }`

**Notes**:
- Test SessionService.retrySession() ownership check
- No UI involved — pure API security test

---

## W-M03-L2-011 — Abandoned session rejects further answers → 500 or specific error

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @practice @security @write @serial

**Setup**:
- Create session
- Manually mark session `abandoned` via admin endpoint HOẶC navigate away + back after timeout

**Actions**:
1. POST `/api/sessions/{abandonedId}/answer` với valid body

**API Verification**:
- Response 500 or 400 với error "Session has been abandoned"
- `GET /api/sessions/{id}` → status vẫn là `abandoned`

**Notes**:
- FIX-002: abandoned sessions reject answers
- [POTENTIAL NOT IMPLEMENTED]: admin endpoint `/api/admin/test/sessions/{id}/abandon` — nếu không có, dùng DB direct update hoặc skip case này

---

## W-M03-L2-012 — Smart question selection: prioritize unseen questions

**Priority**: P1
**Est. runtime**: ~10s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @practice @smart-selection @write @serial

**Setup**:
- `POST /api/admin/test/users/{userId}/reset-history`
- `POST /api/admin/test/users/{userId}/mock-history?percentSeen=50&percentWrong=20` — mock 50% questions seen, 20% wrong

**Rationale**: `smartQuestionSelector.selectQuestions()` prioritize unseen + review questions cho practice.

**Actions**:
1. Start practice session với count=20 (đủ lớn để lấy mix)
2. `GET /api/sessions/{id}` → extract `questionIds` from response

**API Verification**:
- Query `UserQuestionHistory` qua admin endpoint (hoặc indirect):
  - At least X% of selected questions có `seenCount = 0` (unseen priority)
  - Weaknesses (`wrongCount > correctCount`) cũng được priority

**Notes**:
- [POTENTIAL NOT IMPLEMENTED]: endpoint để query selected questions vs history. Nếu không có, simplify: chỉ verify count không trùng câu đã answer trong session trước
- Smart selector là SELLING POINT của Practice — test cần đảm bảo không regress

---

## W-M03-L2-013 — Session timer tier-based: tier 3 user → timer khác tier 1

**Priority**: P2
**Est. runtime**: ~5s
**Auth**: fresh login as test3@dev.local
**Tags**: @happy-path @practice @serial

**Rationale**: `smartQuestionSelector.getTimerSeconds(userId)` — higher tier = shorter timer.

**Setup**:
- `set-tier?tierLevel=3`

**Actions**:
1. Create session via POST /api/sessions
2. `GET /api/sessions/{id}` → response có `questions[].timeLimitSec`

**API Verification**:
- `timeLimitSec` cho tier 3 phải khớp với `smartQuestionSelector.getTimerSeconds(3)` value (đọc code để biết exact value, typically 25-30s)
- Compare với tier 1 user (tạo separate user) → tier 1 có timer dài hơn

**Notes**:
- Cần đọc `SmartQuestionSelector.getTimerSeconds()` implementation để biết formula
- Có thể skip nếu formula không deterministic theo tier

---

## NEEDS TESTID Summary (W-M03 L2)

| Element | Suggested testid | File |
|---------|-----------------|------|
| Practice page start btn | `practice-start-btn` | pages/Practice.tsx |
| Difficulty chips | `practice-difficulty-chip-{easy|medium|hard|all}` | pages/Practice.tsx |
| Count buttons | `practice-count-btn-{5|10|20|50}` | pages/Practice.tsx |
| Show explanation toggle | `practice-show-explanation-toggle` | pages/Practice.tsx |
| Book selector | `practice-book-select` | pages/Practice.tsx |
| Quiz progress | `quiz-progress` | pages/Quiz.tsx |
| Quiz score delta | `quiz-score-delta` | pages/Quiz.tsx |
| Quiz explanation | `quiz-explanation` | pages/Quiz.tsx |
| Review page | `review-page` | pages/Review.tsx |
| Review total correct | `review-total-correct` | pages/Review.tsx |
| Review question item | `review-question-item` | pages/Review.tsx |
| Review retry btn | `review-retry-btn` | pages/Review.tsx |

---

## NOT IMPLEMENTED / BLOCKERS

| Feature | Impact | Suggested |
|---------|--------|-----------|
| Admin endpoint to abandon session | L2-011 partial | Add `POST /api/admin/test/sessions/{id}/abandon` hoặc skip L2-011 |
| Admin endpoint to query question history count | L2-005 partial, L2-012 partial | Indirect verify qua `GET /api/me/weaknesses` |
| Force difficulty filter trong preview | L2-003/004 | Confirm `preview-questions?difficulty=X` hoạt động |

---

## Open Questions

1. **Practice session completion**: Session tự động set status `completed` khi answer last question, hay cần explicit POST endpoint? (ảnh hưởng L2-007)
2. **Navigation sau quiz complete**: Auto redirect đến `/review` hay hiện results screen trước? (ảnh hưởng actions flow)
3. **Timer per question**: `timeLimitSec` cho tier 3 = bao nhiêu? (L2-013)
4. **Smart selector unseen priority**: Selector algorithm ưu tiên % bao nhiêu unseen vs review? (L2-012)

---

## Runtime Estimate

| Case | Runtime |
|------|---------|
| L2-001 | 6s |
| L2-002 | 6s |
| L2-003 | 6s |
| L2-004 | 12s |
| L2-005 | 6s |
| L2-006 | 5s |
| L2-007 | 25s |
| L2-008 | 8s |
| L2-009 | 5s |
| L2-010 | 5s |
| L2-011 | 5s |
| L2-012 | 10s |
| L2-013 | 5s |
| **Total** | **~104s (~1.7 min)** |

Parallel-safe: 1 case (L2-010 có thể parallel nếu tạo user riêng). Remaining @serial.

---

## Summary

- **13 cases** (vs 12–14 estimate)
- **P0**: 4 | **P1**: 7 | **P2**: 2
- **Critical invariant**: Practice mode score **KHÔNG ảnh hưởng `User.totalPoints`** — verify ở L2-002, L2-007
- **Critical security**: L2-006 (elapsed cap), L2-010 (retry ownership), L2-011 (abandoned reject)
- **NEEDS TESTID**: 12 elements
- **NOT IMPLEMENTED**: 3 potential gaps (query helpers — indirect workarounds OK)
- **Runtime**: ~1.7 min serial
