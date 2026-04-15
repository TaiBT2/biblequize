# APP-M03 — Practice Mode (L1 Smoke)

**Screens:** PracticeSelectScreen → QuizScreen → QuizResultsScreen → QuizReviewScreen
**Spec ref:** Game mode: Practice
**Auth required:** Yes

---

## APP-M03-L1-001 — PracticeSelectScreen render đúng với difficulty + count options

**Priority**: P0
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @practice @critical

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- tapOn: "Luyện Tập"
- waitForAnimationToEnd
- assertVisible:
    id: "practice-select-screen"
- assertVisible: "Luyện Tập"
- assertVisible: "Chọn cấu hình quiz của bạn"
- assertVisible: "Độ khó"
- assertVisible: "Tất cả"
- assertVisible: "Dễ"
- assertVisible: "Trung bình"
- assertVisible: "Khó"
- assertVisible: "Số câu hỏi"
- assertVisible:
    id: "practice-start-btn"
```

**Assertions**:
- PracticeSelectScreen visible
- Title + subtitle visible
- All 4 difficulty chips visible: "Tất cả", "Dễ", "Trung bình", "Khó"
- "Số câu hỏi" section visible
- Start button visible

**Notes**:
- [NEEDS TESTID: practice-select-screen] — root ScrollView
- [NEEDS TESTID: practice-start-btn] — "Bắt đầu Luyện Tập" button
- Difficulty chips dùng text selectors

---

## APP-M03-L1-002 — Chọn difficulty + count → Start quiz → QuizScreen

**Priority**: P0
**Est. runtime**: ~12s
**Tags**: @smoke @mobile @practice @critical

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
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
- assertVisible:
    id: "quiz-timer"
- assertVisible:
    id: "quiz-progress-bar"
- assertVisible:
    id: "quiz-answer-option-0"
- assertVisible:
    id: "quiz-answer-option-1"
- assertVisible:
    id: "quiz-answer-option-2"
- assertVisible:
    id: "quiz-answer-option-3"
```

**Assertions**:
- Tap "Dễ" → chip selected
- Tap "5" → count selected
- Tap Start → POST `/api/sessions` → navigate to QuizScreen
- QuizScreen: question text, timer, progress bar, 4 answer options visible

**Notes**:
- [NEEDS TESTID: quiz-screen] — root View của QuizScreen
- [NEEDS TESTID: quiz-question-text] — Text câu hỏi
- [NEEDS TESTID: quiz-timer] — countdown timer display
- [NEEDS TESTID: quiz-progress-bar] — ProgressBar component
- [NEEDS TESTID: quiz-answer-option-0..3] — 4 answer Pressable buttons (index 0-3)
- Precondition: backend running, questions seeded

---

## APP-M03-L1-003 — Trả lời câu hỏi → thấy feedback đúng/sai → câu tiếp theo

**Priority**: P1
**Est. runtime**: ~15s
**Tags**: @smoke @mobile @practice

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth + navigate to QuizScreen với 5 câu]
- tapOn:
    id: "quiz-answer-option-0"
- waitForAnimationToEnd
- assertVisible:
    id: "quiz-answer-feedback"
- tapOn:
    id: "quiz-next-btn"
- waitForAnimationToEnd
- assertVisible:
    id: "quiz-question-text"
```

**Assertions**:
- Tap any answer → `quiz-answer-feedback` visible (correct/wrong indicator)
- Tap Next → new question text visible

**Notes**:
- [NEEDS TESTID: quiz-answer-feedback] — View hiển thị ✓ correct / ✗ wrong sau khi chọn
- [NEEDS TESTID: quiz-next-btn] — "Tiếp theo" / "Next" button sau khi chọn answer

---

## APP-M03-L1-004 — Hoàn thành quiz → QuizResultsScreen

**Priority**: P1
**Est. runtime**: ~30s
**Tags**: @smoke @mobile @practice

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth + start 5-question practice quiz]
# Answer all 5 questions
- repeat:
    times: 5
    commands:
      - tapOn:
          id: "quiz-answer-option-0"
      - waitForAnimationToEnd
      - tapOn:
          id: "quiz-next-btn"
      - waitForAnimationToEnd
- assertVisible:
    id: "quiz-results-screen"
- assertVisible:
    id: "results-score"
- assertVisible:
    id: "results-correct-count"
- assertVisible:
    id: "results-home-btn"
- assertVisible:
    id: "results-review-btn"
```

**Assertions**:
- After 5 answers → QuizResultsScreen visible
- Score, correct count visible
- Home button và Review button visible

**Notes**:
- [NEEDS TESTID: quiz-results-screen] — root View QuizResultsScreen
- [NEEDS TESTID: results-score] — Text hiển thị điểm số
- [NEEDS TESTID: results-correct-count] — Text hiển thị X/5 correct
- [NEEDS TESTID: results-home-btn] — "Về trang chủ" button
- [NEEDS TESTID: results-review-btn] — "Xem lại" button

---

## NEEDS TESTID Summary (APP-M03)

| Element | Suggested testID | File |
|---------|-----------------|------|
| Practice select screen | `practice-select-screen` | screens/quiz/PracticeSelectScreen.tsx |
| Start button | `practice-start-btn` | screens/quiz/PracticeSelectScreen.tsx |
| Quiz screen | `quiz-screen` | screens/quiz/QuizScreen.tsx |
| Question text | `quiz-question-text` | screens/quiz/QuizScreen.tsx |
| Timer | `quiz-timer` | screens/quiz/QuizScreen.tsx |
| Progress bar | `quiz-progress-bar` | screens/quiz/QuizScreen.tsx |
| Answer option 0-3 | `quiz-answer-option-{n}` | screens/quiz/QuizScreen.tsx |
| Answer feedback | `quiz-answer-feedback` | screens/quiz/QuizScreen.tsx |
| Next button | `quiz-next-btn` | screens/quiz/QuizScreen.tsx |
| Results screen | `quiz-results-screen` | screens/quiz/QuizResultsScreen.tsx |
| Score | `results-score` | screens/quiz/QuizResultsScreen.tsx |
| Correct count | `results-correct-count` | screens/quiz/QuizResultsScreen.tsx |
| Home button | `results-home-btn` | screens/quiz/QuizResultsScreen.tsx |
| Review button | `results-review-btn` | screens/quiz/QuizResultsScreen.tsx |
