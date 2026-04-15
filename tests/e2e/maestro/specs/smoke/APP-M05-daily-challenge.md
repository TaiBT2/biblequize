# APP-M05 — Daily Challenge (L1 Smoke)

**Screens:** DailyChallengeScreen → QuizScreen (daily mode)
**Spec ref:** Game mode: Daily Challenge (Thử Thách Hàng Ngày)
**Auth required:** Yes

---

## APP-M05-L1-001 — DailyChallengeScreen render đúng

**Priority**: P0
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @daily @critical

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- tapOn: "Thử Thách Ngày"
- waitForAnimationToEnd
- assertVisible:
    id: "daily-screen"
- assertVisible: "Thử Thách Hàng Ngày"
- assertVisible:
    id: "daily-hero-card"
- assertVisible: "5"
- assertVisible: "câu hỏi hôm nay"
- assertVisible: "+50 XP"
```

**Assertions**:
- DailyChallengeScreen visible
- Title "Thử Thách Hàng Ngày" visible
- Hero card visible với "5" câu hỏi, "+50 XP" reward

**Notes**:
- [NEEDS TESTID: daily-screen] — root ScrollView DailyChallengeScreen
- [NEEDS TESTID: daily-hero-card] — Card component chứa challenge info
- "5", "câu hỏi hôm nay", "+50 XP" là static text → không cần testID

---

## APP-M05-L1-002 — Start button visible và enabled khi questions loaded

**Priority**: P1
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @daily

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- tapOn: "Thử Thách Ngày"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible: "Bắt đầu"
- assertEnabled:
    text: "Bắt đầu"
```

**Assertions**:
- "Bắt đầu" button visible (Button component với title="Bắt đầu")
- Button enabled (không disabled) sau khi questions loaded từ `/api/daily-challenge`

**Notes**:
- Button bị `disabled` khi `questions.length === 0` (data chưa load hoặc API lỗi)
- Precondition: backend running với daily challenge seeded cho ngày hôm nay

---

## APP-M05-L1-003 — Tap Start → bắt đầu daily quiz với 5 câu

**Priority**: P1
**Est. runtime**: ~12s
**Tags**: @smoke @mobile @daily

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- tapOn: "Thử Thách Ngày"
- waitForAnimationToEnd:
    timeout: 5000
- tapOn: "Bắt đầu"
- waitForAnimationToEnd:
    timeout: 3000
- assertVisible:
    id: "quiz-screen"
- assertVisible:
    id: "quiz-question-text"
```

**Assertions**:
- Tap "Bắt đầu" → navigate to QuizScreen với `mode: "daily"`
- QuizScreen: question text visible
- Daily mode: `showExplanation: true`, không cần `sessionId`

**Notes**:
- Daily mode navigate trực tiếp với questions array (không POST `/api/sessions`)
- Maestro `assertEnabled` — kiểm tra button không bị opacity disable

---

## APP-M05-L1-004 — Daily challenge đã hoàn thành hôm nay — completed state

**Priority**: P1
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @daily

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth + daily already completed via API seed]
- tapOn: "Thử Thách Ngày"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "daily-completed-card"
```

**Assertions**:
- Khi daily đã completed hôm nay → `daily-completed-card` visible (thay hero card)
- Start button ẩn hoặc disabled

**Notes**:
- [NEEDS TESTID: daily-completed-card] — Card hiển thị "Đã hoàn thành hôm nay" state
- [NOT IMPLEMENTED: `/api/admin/test/users/{id}/complete-daily` helper endpoint chưa có — khó seed "completed" state trong test. Cần implement endpoint này hoặc dùng `set-mission-state` từ AdminTestController]
- Workaround: Dùng `POST /api/admin/test/users/{id}/set-mission-state` với `completed: true` để mark daily missions done

---

## NEEDS TESTID Summary (APP-M05)

| Element | Suggested testID | File |
|---------|-----------------|------|
| Daily screen | `daily-screen` | screens/quiz/DailyChallengeScreen.tsx |
| Hero card | `daily-hero-card` | screens/quiz/DailyChallengeScreen.tsx |
| Completed card | `daily-completed-card` | screens/quiz/DailyChallengeScreen.tsx |

## NOT IMPLEMENTED Summary

| Feature | Notes |
|---------|-------|
| Daily complete helper API | `POST /api/admin/test/users/{id}/complete-daily` không tồn tại. Dùng set-mission-state thay thế |
