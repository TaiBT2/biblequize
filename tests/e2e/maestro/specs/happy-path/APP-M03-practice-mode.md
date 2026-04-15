# APP-M03 — Practice Mode (L2 Happy Path)

**Screens:** PracticeSelectScreen → QuizScreen → QuizResultsScreen → QuizReviewScreen
**Spec ref:** SPEC_USER §5.1 (mobile mirror)
**Module priority:** Tier 1 (core game loop, scoring + review)

---

## ⚠️ Scoring Formula (mirror web W-M03)

Mobile Practice dùng SessionService.computeScore() — KHÁC RANKED:
```
base = { easy: 10, medium: 20, hard: 30 }
timeBonus = timeLeftSec / 2
perfectBonus = timeLeftSec >= 25 ? 5 : 0
mult = { easy: 1.0, medium: 1.2, hard: 1.5 }
earned = floor((base + timeBonus + perfectBonus) × mult)
```
- ❌ KHÔNG combo, KHÔNG daily first, KHÔNG tier multiplier
- ❌ Practice **KHÔNG cộng `User.totalPoints`** — critical invariant

---

## APP-M03-L2-001 — Start practice session → POST /api/sessions với config

**Priority**: P0
**Est. runtime**: ~15s
**Tags**: @happy-path @mobile @practice @critical

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [auth]
- tapOn: "Luyện Tập"
- waitForAnimationToEnd
- tapOn: "Dễ"
- tapOn: "5"
- tapOn:
    id: "practice-start-btn"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "quiz-screen"
- assertVisible:
    id: "quiz-question-text"
```

**API Verification**:
- POST `/api/sessions` fired với body `{ mode: "practice", difficulty: "easy", questionCount: 5, showExplanation: true }`
- Response có `sessionId` (UUID), `questions` array length=5

---

## APP-M03-L2-002 — Answer easy correct <5s → perfect bonus applied

**Priority**: P0
**Est. runtime**: ~12s
**Tags**: @happy-path @mobile @practice @scoring

**Expected** (easy, ~3s):
```
base=10, timeLeftSec=27, timeBonus=13, perfectBonus=5
earned = (10+13+5) × 1.0 = 28
```

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [start practice easy/1]
- tapOn:
    id: "quiz-answer-0"  # immediate
- waitForAnimationToEnd
- assertVisible:
    id: "quiz-answer-feedback"
```

**API Verification**:
- `GET /api/sessions/{id}` → `score ≈ 28 (±8 tolerance)`, `correctAnswers: 1`
- `GET /api/me` → `totalPoints` UNCHANGED (practice invariant)

---

## APP-M03-L2-003 — Answer hard correct fast → difficulty mult 1.5x

**Priority**: P0
**Est. runtime**: ~12s
**Tags**: @happy-path @mobile @practice @scoring

**Expected**: `(30+13+5) × 1.5 = 72`

**API Verification**:
- `score ≈ 72 (±10)`

---

## APP-M03-L2-004 — Answer wrong → 0 score delta, UserQuestionHistory recorded

**Priority**: P0
**Est. runtime**: ~12s
**Tags**: @happy-path @mobile @practice

**Setup**:
- Preview question → wrong answer idx

**Maestro YAML**:
```yaml
- tapOn:
    id: "quiz-answer-1"  # wrong
- waitForAnimationToEnd
- assertVisible:
    id: "quiz-answer-feedback"
- assertVisible:
    id: "quiz-explanation"  # shown on wrong if showExplanation=true
```

**API Verification**:
- `GET /api/sessions/{id}` → `score: 0, correctAnswers: 0`
- User history records this question as wrong (via `/api/me/weaknesses` eventually)

---

## APP-M03-L2-005 — Complete 5-question session → results screen + cumulative score

**Priority**: P1
**Est. runtime**: ~40s
**Tags**: @happy-path @mobile @practice

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [start practice easy/5]
- repeat:
    times: 5
    commands:
      - tapOn:
          id: "quiz-answer-0"
      - waitForAnimationToEnd
      - tapOn:
          id: "quiz-next-btn"
      - waitForAnimationToEnd
- assertVisible:
    id: "quiz-results-screen"
- assertVisible:
    id: "results-correct-count"
```

**API Verification**:
- `GET /api/sessions/{id}` → `status: "completed"`, cumulative score > 0
- `totalPoints` UNCHANGED

---

## APP-M03-L2-006 — Review screen: shows correct answers + explanations

**Priority**: P1
**Est. runtime**: ~15s
**Tags**: @happy-path @mobile @practice @review

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [after quiz complete]
- tapOn:
    id: "results-review-btn"
- waitForAnimationToEnd
- assertVisible:
    id: "quiz-review-screen"
- assertVisible:
    id: "review-question-item"
```

**API Verification**:
- `GET /api/sessions/{id}/review` → array với `questionText, userAnswer, correctAnswer, explanation, isCorrect`

**Notes**:
- [NEEDS TESTID: quiz-review-screen, review-question-item]

---

## APP-M03-L2-007 — Cancel mid-quiz → exit confirmation dialog → go back

**Priority**: P1
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @practice

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [mid quiz]
- back  # Android hardware back
- assertVisible: "Thoát quiz?"  # Alert.alert text
- tapOn: "Thoát"
- waitForAnimationToEnd
- assertVisible:
    id: "practice-select-screen"
```

**Notes**:
- QuizScreen có BackHandler.addEventListener — verify confirmation dialog

---

## APP-M03-L2-008 — Timer expires → auto advance to wrong answer

**Priority**: P2
**Est. runtime**: ~40s (wait timer)
**Tags**: @happy-path @mobile @practice

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [mid quiz, wait 30+ seconds]
- waitForAnimationToEnd:
    timeout: 32000
- assertVisible:
    id: "quiz-answer-feedback"
```

**API Verification**:
- Question counted as wrong
- Next question visible after auto advance

**Notes**:
- Runtime heavy — chỉ chạy khi stress test

---

## NEEDS TESTID Summary (APP-M03 L2)

| Element | Suggested testID |
|---------|-----------------|
| Practice select screen | `practice-select-screen` |
| Practice start btn | `practice-start-btn` |
| Quiz screen | `quiz-screen` |
| Quiz question text | `quiz-question-text` |
| Quiz answer option | `quiz-answer-{n}` |
| Quiz next btn | `quiz-next-btn` |
| Quiz answer feedback | `quiz-answer-feedback` |
| Quiz explanation | `quiz-explanation` |
| Quiz results screen | `quiz-results-screen` |
| Results correct count | `results-correct-count` |
| Results review btn | `results-review-btn` |
| Quiz review screen | `quiz-review-screen` |
| Review question item | `review-question-item` |

---

## Summary
- **8 cases**
- **P0**: 4 | **P1**: 3 | **P2**: 1
- Critical invariant: practice **không cộng totalPoints**
