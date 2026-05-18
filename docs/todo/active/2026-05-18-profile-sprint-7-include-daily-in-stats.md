# 2026-05-18 — Profile Sprint 7: Daily Challenge invisible to /api/me/stats

> **Source**: User report 2026-05-18 — even after Sprint 6 BE endpoint, "TỈ LỆ ĐÚNG" + "TỔNG PHIÊN" still 0. User played 2 Daily Challenges (streak=2) but stats showed 0.

### Root cause

`DailyChallengeController.@PostMapping("/answer")` comment line 96-97: *"check a single answer **without a real QuizSession**"*. Daily Challenge intentionally bypasses both `QuizSession` AND `UserQuestionHistory` tables. So a pure Daily Challenge user has:
- `UserQuestionHistory` rows = 0 → /api/me/stats UQH SUMs = 0
- `QuizSession.completed` rows = 0 → /api/me/stats `totalSessions` = 0

But Daily Challenge **does** persist per-day completion in `DailyCompletion` table (`DailyChallengeService.markCompleted` line 220-226) with `score, correctCount, totalQuestions=5`. `DailyCompletionRepository` had no SUM-overall method.

### Task

- PRO-S7-1 Combine UQH + DailyCompletion into /api/me/stats
  - Add `DailyCompletionRepository.sumStatsByUserId(userId)` — JPQL aggregate `[COUNT(*), SUM(correctCount), SUM(totalQuestions)]`
  - Inject `DailyCompletionRepository` into `UserController`
  - `getStats` now combines:
    - `totalAnswered = (uqhCorrect + uqhWrong) + dcSumTotalQuestions`
    - `totalCorrect = uqhCorrect + dcSumCorrect`
    - `totalSessions = sessionsCompleted + dcCount`
    - `accuracyPercent = totalCorrect / totalAnswered * 100`
  - Status: [x] DONE
  - Files: `DailyCompletionRepository.java`, `UserController.java`
  - Test: `mvnw compile -q -o → EXIT=0`; FE Tầng 3 1167/125 = 0 regression (no FE change)
  - Commit: `fix(api): include Daily Challenge in /api/me/stats accuracy + sessions [no-spec-impact]`

### Note

Daily Challenge architectural decision (no QuizSession/UserQuestionHistory writes) is **preserved** — Sprint 7 only adds the aggregation layer in /api/me/stats. If team later wants Daily Challenge to write per-question history (for weakness analysis), that's a separate BE refactor.

### Common

- **Spec impact**: [x] None
- **Spec strategy**: [x] (c) [no-spec-impact]
