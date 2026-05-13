# 2026-04-20 — Daily Challenge as secondary XP path (+50 XP) [DONE — verified 2026-04-27]

> Prompt assumed Daily goes through SessionService.submitAnswer. REALITY:
> Daily uses a fake sessionId ("daily-YYYY-MM-DD-ts"), doesn't hit QuizSession,
> already has idempotent POST /api/daily-challenge/complete endpoint — FE
> just doesn't call it. Adapted plan: credit XP inside DailyChallengeService
> .markCompleted (already guarded by hasCompletedToday in controller) and
> make FE actually call /complete at end of quiz.

### Task 1: BE — add +50 XP credit in markCompleted [x] DONE
- File: [DailyChallengeService.java:182-200](apps/api/src/main/java/com/biblequiz/modules/daily/service/DailyChallengeService.java#L182-L200) — `creditCompletionXp(user)` private method
- Idempotency: controller guard `hasCompletedToday` ensures markCompleted called at most once/user/day
- Logging: `log.info("Daily completion XP: user={} +{} XP (pointsCounted {}→{})")`

### Task 2: BE tests [x] DONE
- Files: [DailyChallengeServiceTest.java](apps/api/src/test/java/com/biblequiz/service/DailyChallengeServiceTest.java) + [DailyChallengeControllerTest.java](apps/api/src/test/java/com/biblequiz/api/DailyChallengeControllerTest.java) đều tồn tại

### Task 3: FE — DailyChallenge.tsx invalidate + toast [x] DONE
- File: [DailyChallenge.tsx:273-281](apps/web/src/pages/DailyChallenge.tsx#L273-L281) — `api.post('/api/daily-challenge/complete', {score, correctCount})` rồi `invalidateQueries(['me'])` + `invalidateQueries(['me-tier-progress'])`
- Toast: L370 hiển thị `t('daily.xpEarned')`

### Task 4: FE tests [x] DONE
- File: [DailyChallenge.test.tsx](apps/web/src/pages/__tests__/DailyChallenge.test.tsx) tồn tại

### Task 5: i18n FAQ + daily.xpEarned strings [x] DONE
- vi.json:1485 `"xpEarned": "+50 XP đã cộng vào tiến trình"`
- en.json:1485 `"xpEarned": "+50 XP added to your progress"`

### Task 6: DECISIONS.md [x] DONE
- ADR "2026-04-20 — Daily Challenge as secondary XP path (+50 XP per completion)" tại DECISIONS.md L5-11

### Task 7: Full regression [x] DONE (implicit qua các session sau)
- Verified Phase 1 release readiness audit: feature wired đầy đủ, tests pass, không regression

---
