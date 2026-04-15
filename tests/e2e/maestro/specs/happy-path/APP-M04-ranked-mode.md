# APP-M04 — Ranked Mode (L2 Happy Path)

**Screens:** RankedScreen → QuizScreen → QuizResultsScreen
**Spec ref:** SPEC_USER §5.2 (mobile mirror)
**Module priority:** Tier 1 (scoring formula + tier bump + lives/cap)

---

## Shared setup (Maestro)

```yaml
# Mirror Phase 4a W-M04 patterns: pre-seed state via admin endpoints before test
# Dùng ephemeral test user qua seed API OR reuse test3@dev.local

# beforeEach conceptual:
# 1. POST /api/admin/test/users/{userId}/set-state { livesRemaining: 100, questionsCounted: N }
# 2. POST /api/admin/test/users/{userId}/seed-points { totalPoints: M } (cho tier-bump tests)
# 3. Launch app with clearState + DEV Quick Login
```

**Maestro constraint**: Setup API calls phải chạy TRƯỚC `launchApp` qua shell/CI hook, không gọi được trong YAML flow.

---

## APP-M04-L2-001 — RankedScreen hiển thị tier/energy/questionsCounted từ API

**Priority**: P0
**Est. runtime**: ~15s
**Tags**: @happy-path @mobile @ranked @critical

**Setup (pre-flow)**:
- `POST set-state`: `{ livesRemaining: 100, questionsCounted: 0 }`

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- launchApp:
    clearState: true
# [auth flow]
- tapOn: "Thi Đấu"
- waitForAnimationToEnd
- assertVisible:
    id: "ranked-screen"
- assertVisible:
    id: "ranked-tier-card"
- assertVisible: "100"  # energy
- assertVisible: "0/100"  # questions counted
```

**API Verification** (post-flow via shell):
- `GET /api/me/ranked-status` → `{ livesRemaining: 100, questionsCounted: 0 }`
- `GET /api/me/tier` → tier của user

**Notes**:
- [NEEDS TESTID: ranked-screen, ranked-tier-card, ranked-energy-display, ranked-questions-counted]
- Mobile L2 assertions chủ yếu text-based do testID gap; API verification là authority chính

---

## APP-M04-L2-002 — Start session → POST /api/ranked/sessions returns sessionId

**Priority**: P0
**Est. runtime**: ~12s
**Tags**: @happy-path @mobile @ranked @critical

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [auth + ranked screen]
- tapOn:
    id: "ranked-start-btn"
- waitForAnimationToEnd:
    timeout: 5000
- assertVisible:
    id: "quiz-screen"
- assertVisible:
    id: "quiz-question-text"
```

**API Verification**:
- POST `/api/ranked/sessions` fired (intercept qua HTTP proxy/MockServer)
- Response `{ sessionId: "ranked-...", currentBook, bookProgress }`

---

## APP-M04-L2-003 — Answer 1 easy correct slow (~20s) → base XP only (no speed bonus)

**Priority**: P0
**Est. runtime**: ~30s
**Tags**: @happy-path @mobile @ranked @scoring

**Setup**:
- `set-state`: `{ livesRemaining: 100, questionsCounted: 1 }` — avoid daily first ×2
- Preview 1 easy question → know correct answer

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [auth + start ranked]
- assertVisible:
    id: "quiz-question-text"
# Wait ~20s để speed bonus ≈ 0
- waitForAnimationToEnd:
    timeout: 22000
- tapOn:
    id: "quiz-answer-0"  # assume correct is index 0 from preview
- waitForAnimationToEnd
- assertVisible:
    id: "quiz-answer-feedback"
```

**API Verification**:
- `GET /api/me` before vs after → `totalPoints` delta = `round(8 × tier3Multiplier)` (±2 tolerance for clock drift)
- `GET /api/me/ranked-status` → `questionsCounted=2`, `livesRemaining=100`

**Notes**:
- Maestro không deterministic cho elapsed time like Playwright → tolerance larger (±4 XP)

---

## APP-M04-L2-004 — Answer fast (<3s) → speed bonus applied

**Priority**: P0
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @ranked @scoring

**Setup**:
- `set-state`: `{ livesRemaining: 100, questionsCounted: 1 }`

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [start ranked, question visible]
- tapOn:
    id: "quiz-answer-0"  # IMMEDIATE — no wait = fast click
```

**API Verification**:
- Delta XP > base (8) → speed bonus > 0
- Formula: `(8 + speedBonus) × tierMult` where speedBonus ≈ 3-4 for very fast click

---

## APP-M04-L2-005 — Wrong answer → lives=95, no XP, streak reset

**Priority**: P0
**Est. runtime**: ~15s
**Tags**: @happy-path @mobile @ranked

**Setup**:
- `set-state`: `{ livesRemaining: 100, questionsCounted: 1 }`
- Preview 1 question → know correct answer is idx N, use wrong idx (N+1)%4

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [start ranked]
- tapOn:
    id: "quiz-answer-1"  # assume wrong
- waitForAnimationToEnd
- assertVisible:
    id: "quiz-answer-feedback"
```

**API Verification**:
- `GET /api/me` → totalPoints unchanged
- `GET /api/me/ranked-status` → `livesRemaining: 95` (-5), `questionsCounted: 2`

---

## APP-M04-L2-006 — Pre-seed lives=0 → start button disabled/hidden

**Priority**: P1
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @ranked @energy

**Setup**:
- `set-state`: `{ livesRemaining: 0, questionsCounted: 50 }`

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [auth + navigate to Thi Đấu]
- tapOn: "Thi Đấu"
- waitForAnimationToEnd
- assertVisible: "0"  # energy = 0
- assertVisible:
    id: "ranked-no-energy-msg"
# Start button disabled — verify by trying to tap and expecting no navigation
```

**API Verification**:
- `GET /api/me/ranked-status` → `livesRemaining: 0`

**Notes**:
- [NEEDS TESTID: ranked-no-energy-msg]
- Maestro không có `assertDisabled` — dùng assertVisible của disabled state element

---

## APP-M04-L2-007 — Pre-seed cap=100 → daily cap reached message

**Priority**: P1
**Est. runtime**: ~10s
**Tags**: @happy-path @mobile @ranked @energy

**Setup**:
- `set-state`: `{ livesRemaining: 100, questionsCounted: 100 }`

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
- tapOn: "Thi Đấu"
- waitForAnimationToEnd
- assertVisible: "100/100"
- assertVisible:
    id: "ranked-cap-reached-msg"
```

**Notes**:
- [NEEDS TESTID: ranked-cap-reached-msg]

---

## APP-M04-L2-008 — Tier bump: pre-seed 4999 → 1 correct → tier 3 + 30 star bonus

**Priority**: P0
**Est. runtime**: ~20s
**Tags**: @happy-path @mobile @ranked @tier-bump

**Setup**:
- `POST seed-points { totalPoints: 4999 }`
- `POST set-state { livesRemaining: 100, questionsCounted: 5 }` (not daily first)
- Preview 1 easy question

**Maestro YAML**:
```yaml
appId: com.biblequiz.app
---
# [auth + start ranked]
- tapOn:
    id: "quiz-answer-0"  # correct, wait any time
- waitForAnimationToEnd:
    timeout: 3000
# Tier up modal may appear
- assertVisible:
    id: "tier-up-modal"
```

**API Verification**:
- `GET /api/me/tier-progress` → `tierLevel: 3, tierName: "Môn Đồ"`
- Delta totalPoints includes +30 star bonus

**Notes**:
- [NEEDS TESTID: tier-up-modal]
- Mobile tier-up modal fires via tierProgression logic module — verify in [tierProgression.ts](apps/mobile/src/logic/tierProgression.ts)

---

## NEEDS TESTID Summary (APP-M04 L2)

| Element | Suggested testID |
|---------|-----------------|
| Ranked screen root | `ranked-screen` |
| Tier card | `ranked-tier-card` |
| Energy display | `ranked-energy-display` |
| Questions counted | `ranked-questions-counted` |
| Start button | `ranked-start-btn` |
| No energy message | `ranked-no-energy-msg` |
| Cap reached message | `ranked-cap-reached-msg` |
| Quiz screen | `quiz-screen` |
| Quiz question text | `quiz-question-text` |
| Quiz answer option | `quiz-answer-{n}` |
| Answer feedback | `quiz-answer-feedback` |
| Tier up modal | `tier-up-modal` |

---

## Summary
- **8 cases**
- **P0**: 5 | **P1**: 2
- Dependencies: `seed-points` (unblocked), `set-state`, `preview-questions` endpoints
- Runtime: ~2 min serial (maestro emulator slower than Playwright)
