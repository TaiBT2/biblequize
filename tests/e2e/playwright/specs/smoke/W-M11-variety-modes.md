# W-M11 — Variety Modes (L1 Smoke)

**Routes:** `/weekly-quiz`, `/mystery-mode`, `/speed-round`
**Spec ref:** SPEC_USER §5.4

---

### W-M11-L1-001 — Weekly Quiz page render đúng

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @variety @weekly-quiz

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/weekly-quiz')`
2. `page.waitForSelector('[data-testid="weekly-quiz-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/weekly-quiz')`
- `expect(page.getByTestId('weekly-quiz-page')).toBeVisible()`
- `expect(page.getByTestId('weekly-quiz-theme-card')).toBeVisible()`
- `expect(page.getByTestId('weekly-quiz-countdown')).toBeVisible()` ← countdown tới tuần tới
- `expect(page.getByTestId('weekly-quiz-start-btn')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: weekly-quiz-page] — wrapper trang WeeklyQuiz
- [NEEDS TESTID: weekly-quiz-theme-card] — card hiển thị chủ đề tuần (themeName, themeNameEn)
- [NEEDS TESTID: weekly-quiz-countdown] — countdown (vd: "3 ngày")
- [NEEDS TESTID: weekly-quiz-start-btn] — nút "Bắt Đầu"

---

### W-M11-L1-002 — Weekly Quiz: click Start → vào quiz với mode weekly_quiz

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @smoke @variety @weekly-quiz

**Setup**: none

**Preconditions**:
- Có weekly quiz active tuần này

**Actions**:
1. `page.goto('/weekly-quiz')`
2. `page.waitForSelector('[data-testid="weekly-quiz-start-btn"]')`
3. `page.getByTestId('weekly-quiz-start-btn').click()`
4. `page.waitForURL('/quiz')`

**Assertions**:
- `expect(page).toHaveURL('/quiz')`
- `expect(page.getByTestId('quiz-question-text')).toBeVisible()`

**Cleanup**: none

---

### W-M11-L1-003 — Mystery Mode page render đúng

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @variety @mystery

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/mystery-mode')`
2. `page.waitForSelector('[data-testid="mystery-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/mystery-mode')`
- `expect(page.getByTestId('mystery-page')).toBeVisible()`
- `expect(page.getByTestId('mystery-info-card')).toBeVisible()`
- `expect(page.getByTestId('mystery-bonus-xp')).toBeVisible()` ← "1.5x XP"
- `expect(page.getByTestId('mystery-start-btn')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: mystery-page] — wrapper trang MysteryMode
- [NEEDS TESTID: mystery-info-card] — card với ??? placeholders (book/difficulty/topic ẩn)
- [NEEDS TESTID: mystery-bonus-xp] — badge "1.5x XP"
- [NEEDS TESTID: mystery-start-btn] — nút "Bắt Đầu"

---

### W-M11-L1-004 — Mystery Mode: click Start → vào quiz

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @smoke @variety @mystery

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/mystery-mode')`
2. `page.waitForSelector('[data-testid="mystery-start-btn"]')`
3. `page.getByTestId('mystery-start-btn').click()`
4. `page.waitForURL('/quiz')`

**Assertions**:
- `expect(page).toHaveURL('/quiz')`
- `expect(page.getByTestId('quiz-question-text')).toBeVisible()`

**Cleanup**: none

---

### W-M11-L1-005 — Speed Round page render đúng

**Priority**: P1
**Est. runtime**: ~3s
**Auth**: storageState=tier3
**Tags**: @smoke @variety @speed-round

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/speed-round')`
2. `page.waitForSelector('[data-testid="speed-round-page"]')`

**Assertions**:
- `expect(page).toHaveURL('/speed-round')`
- `expect(page.getByTestId('speed-round-page')).toBeVisible()`
- `expect(page.getByTestId('speed-round-stats-card')).toBeVisible()`
- `expect(page.getByTestId('speed-round-timer-stat')).toHaveText(/10/)` ← "10s per question"
- `expect(page.getByTestId('speed-round-bonus-stat')).toHaveText(/2x/)` ← "2x XP bonus"
- `expect(page.getByTestId('speed-round-start-btn')).toBeVisible()`

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: speed-round-page] — wrapper trang SpeedRound
- [NEEDS TESTID: speed-round-stats-card] — card 3 stats (10 câu, 10s, 2x XP)
- [NEEDS TESTID: speed-round-timer-stat] — stat "10 giây"
- [NEEDS TESTID: speed-round-bonus-stat] — stat "2x XP"
- [NEEDS TESTID: speed-round-start-btn] — nút "Bắt Đầu"

---

### W-M11-L1-006 — Speed Round: click Start → vào quiz với timePerQuestion=10

**Priority**: P1
**Est. runtime**: ~5s
**Auth**: storageState=tier3
**Tags**: @smoke @variety @speed-round

**Setup**: none

**Preconditions**:
- User đã đăng nhập

**Actions**:
1. `page.goto('/speed-round')`
2. `page.waitForSelector('[data-testid="speed-round-start-btn"]')`
3. `page.getByTestId('speed-round-start-btn').click()`
4. `page.waitForURL('/quiz')`

**Assertions**:
- `expect(page).toHaveURL('/quiz')`
- `expect(page.getByTestId('quiz-question-text')).toBeVisible()`
- `expect(page.getByTestId('quiz-timer')).toBeVisible()` ← timer hiển thị (10s countdown)

**Cleanup**: none

**Notes**:
- [NEEDS TESTID: quiz-timer] — timer SVG/circle trong Quiz component
- Speed round truyền `timePerQuestion: 10` vào Quiz session

---

## NEEDS TESTID Summary

| Element | Suggested testid | File |
|---------|-----------------|------|
| Weekly Quiz page | `weekly-quiz-page` | WeeklyQuiz.tsx |
| Theme card | `weekly-quiz-theme-card` | WeeklyQuiz.tsx |
| Countdown | `weekly-quiz-countdown` | WeeklyQuiz.tsx |
| Start button | `weekly-quiz-start-btn` | WeeklyQuiz.tsx |
| Mystery page | `mystery-page` | MysteryMode.tsx |
| Info card | `mystery-info-card` | MysteryMode.tsx |
| Bonus XP badge | `mystery-bonus-xp` | MysteryMode.tsx |
| Start button | `mystery-start-btn` | MysteryMode.tsx |
| Speed Round page | `speed-round-page` | SpeedRound.tsx |
| Stats card | `speed-round-stats-card` | SpeedRound.tsx |
| Timer stat | `speed-round-timer-stat` | SpeedRound.tsx |
| Bonus stat | `speed-round-bonus-stat` | SpeedRound.tsx |
| Start button | `speed-round-start-btn` | SpeedRound.tsx |
| Quiz timer | `quiz-timer` | Quiz.tsx |
