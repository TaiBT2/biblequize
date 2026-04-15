# APP-M05 — Daily Challenge (L2 Happy Path)

**Screens:** DailyChallengeScreen → QuizScreen (daily mode)
**Spec ref:** SPEC_USER §5.3 (mobile mirror)
**Module priority:** Tier 1 (daily retention, streak)

---

## ✅ Unblocker: `/complete` endpoint (Phase 4a blocker fix, commit 3ad2542)

Mobile client phải call `POST /api/daily-challenge/complete { score, correctCount }` sau khi user complete all 5 câu để tracking persist. **Verify mobile Daily screen đã wire endpoint này** — nếu chưa, frontend task.

---

## APP-M05-L2-001 — GET /api/daily-challenge returns 5 questions + completion flag

**Priority**: P0
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @daily

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [auth]
- tapOn: "Thử Thách Ngày"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "daily-screen"
- assertVisible: "5"
- assertVisible: "câu hỏi"
```

**API Verification**:
- GET `/api/daily-challenge?language=vi` fired
- Response: `{ questions: [...5], alreadyCompleted: false, totalQuestions: 5 }`

---

## APP-M05-L2-002 — Start daily → QuizScreen với 5 câu fixed

**Priority**: P0
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @daily

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- tapOn: "Thử Thách Ngày"
- waitForAnimationToEnd:
    timeout: 5000
- tapOn: "Bắt đầu"
- waitForAnimationToEnd
- assertVisible:
    id: "quiz-screen"
```

**API Verification**:
- POST `/api/daily-challenge/start` fired → sessionId `daily-{date}-{ts}`
- QuizScreen receives `questions` via navigation params

---

## APP-M05-L2-003 — Complete 5/5 correct → POST /complete fires → alreadyCompleted=true

**Priority**: P0
**Est. runtime**: ~45s
**Tags**: @happy-path @mobile @daily

**Setup**:
- Preview 5 daily questions via admin API → know correct indices
- Ephemeral user OR clear Redis key `daily_challenge:completed:{userId}:{today}`

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [start daily quiz]
- repeat:
    times: 5
    commands:
      - tapOn:
          id: "quiz-answer-0"  # assume all correct index 0 (preview-driven)
      - waitForAnimationToEnd
      - tapOn:
          id: "quiz-next-btn"
      - waitForAnimationToEnd
- assertVisible:
    id: "daily-result-screen"
```

**API Verification**:
- POST `/api/daily-challenge/complete` fires với `{ score, correctCount: 5 }`
- Response: `{ completed: true, alreadyCompleted: false }`
- Subsequent GET `/api/daily-challenge` → `alreadyCompleted: true`

**Notes**:
- [CRITICAL]: Verify mobile code actually calls `/complete` endpoint after last answer. Check [DailyChallengeScreen.tsx](apps/mobile/src/screens/quiz/DailyChallengeScreen.tsx). Nếu chưa wire, [FRONTEND WORK NEEDED].

---

## APP-M05-L2-004 — Re-open /daily after complete → UI locked

**Priority**: P0
**Est. runtime**: ~8s
**Tags**: @happy-path @mobile @daily

**Setup**:
- `POST /api/daily-challenge/complete { score: 100, correctCount: 5 }` via shell (pre-mark complete)

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- tapOn: "Thử Thách Ngày"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "daily-completed-card"
```

**API Verification**:
- GET `/api/daily-challenge` → `alreadyCompleted: true`

**Notes**:
- [NEEDS TESTID: daily-completed-card]

---

## APP-M05-L2-005 — Streak increment: pre-seed streak=5 → complete daily → streak=6

**Priority**: P1
**Est. runtime**: ~50s
**Tags**: @happy-path @mobile @daily @streak

**Setup**:
- `POST /api/admin/test/users/{id}/set-streak?days=5`

**Maestro YAML** (run full complete flow from L2-003)

**API Verification**:
- `GET /api/me/streak` → `currentStreak: 6`
- Home screen `home-streak-badge` displays 6

**Notes**:
- Streak logic shared với ranked/practice — confirm which actions trigger increment

---

## APP-M05-L2-006 — Idempotent: second POST /complete same day → alreadyCompleted=true

**Priority**: P1
**Est. runtime**: ~5s
**Tags**: @happy-path @mobile @daily

**Setup**:
- First POST /complete done

**Flow**: No UI action — pure API test called by mobile during retry scenarios

**API Verification**:
- Second POST `/complete` → `{ completed: true, alreadyCompleted: true }` without overwriting score

---

## NEEDS TESTID Summary (APP-M05 L2)

| Element | Suggested testID |
|---------|-----------------|
| Daily screen | `daily-screen` |
| Daily completed card | `daily-completed-card` |
| Daily result screen | `daily-result-screen` |

---

## Summary
- **6 cases**
- **P0**: 4 | **P1**: 2
- Unblocked by `/complete` endpoint (commit 3ad2542)
