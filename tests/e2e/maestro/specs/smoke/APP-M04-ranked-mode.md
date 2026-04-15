# APP-M04 — Ranked Mode (L1 Smoke)

**Screens:** RankedScreen → QuizScreen (ranked mode)
**Spec ref:** Game mode: Ranked (Thi Đấu Xếp Hạng)
**Auth required:** Yes

---

## APP-M04-L1-001 — RankedScreen render đúng với tier info

**Priority**: P0
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @ranked @critical

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- tapOn: "Thi Đấu"
- waitForAnimationToEnd
- assertVisible:
    id: "ranked-screen"
- assertVisible: "Thi Đấu Xếp Hạng"
- assertVisible:
    id: "ranked-tier-card"
- assertVisible:
    id: "ranked-start-btn"
```

**Assertions**:
- RankedScreen visible
- Title "Thi Đấu Xếp Hạng" visible
- Tier card visible (icon + name + XP + progress bar)
- Start button visible

**Notes**:
- [NEEDS TESTID: ranked-screen] — root ScrollView RankedScreen
- [NEEDS TESTID: ranked-tier-card] — Card component với tier info
- [NEEDS TESTID: ranked-start-btn] — "Bắt đầu Thi Đấu" button

---

## APP-M04-L1-002 — RankedScreen hiển thị leaderboard preview

**Priority**: P1
**Est. runtime**: ~8s
**Tags**: @smoke @mobile @ranked

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- tapOn: "Thi Đấu"
- waitForAnimationToEnd
- scrollUntilVisible:
    element:
      id: "ranked-leaderboard-section"
    direction: DOWN
- assertVisible:
    id: "ranked-leaderboard-section"
```

**Assertions**:
- Scroll down → ranked leaderboard section visible
- Leaderboard entries hoặc empty state visible

**Notes**:
- [NEEDS TESTID: ranked-leaderboard-section] — View chứa leaderboard preview (nếu có)
- RankedScreen có leaderboard section hay không — confirm khi đọc full screen code

---

## APP-M04-L1-003 — Tap Start → bắt đầu ranked quiz (10 câu, no explanation)

**Priority**: P1
**Est. runtime**: ~12s
**Tags**: @smoke @mobile @ranked

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [setup: auth]
- tapOn: "Thi Đấu"
- waitForAnimationToEnd
- tapOn:
    id: "ranked-start-btn"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "quiz-screen"
- assertVisible:
    id: "quiz-question-text"
- assertVisible:
    id: "quiz-timer"
```

**Assertions**:
- Tap Start → POST `/api/sessions` với `mode: "ranked"`, `questionCount: 10`
- Navigate to QuizScreen
- QuizScreen: question, timer visible
- No explanation shown (ranked mode)

**Notes**:
- Ranked mode: `showExplanation: false` — không có explanation view
- Timer default 30s per question

---

## NEEDS TESTID Summary (APP-M04)

| Element | Suggested testID | File |
|---------|-----------------|------|
| Ranked screen | `ranked-screen` | screens/quiz/RankedScreen.tsx |
| Tier card | `ranked-tier-card` | screens/quiz/RankedScreen.tsx |
| Start button | `ranked-start-btn` | screens/quiz/RankedScreen.tsx |
| Leaderboard section | `ranked-leaderboard-section` | screens/quiz/RankedScreen.tsx |
