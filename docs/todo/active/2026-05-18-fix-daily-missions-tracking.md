# 2026-05-18 — Fix: Daily Missions "Trả lời đúng 3 câu" + "Trả lời 3 câu liên tiếp đúng" không tick (không có gạch ngang)

> **Source**: User bug report 2026-05-18 (screenshot widget "Nhiệm vụ hôm nay" — 2 mission stuck ở 0/3 dù đã làm xong)
> **Scope**: BE `DailyMissionService` + `SessionService` + `DailyChallengeController/Service` — thêm tracking calls cho `answer_correct` và `answer_combo`. FE invalidate `['daily-missions']` sau submit answer.

## Root cause

Tier-1 mission template ([DailyMissionService.java:39-44](apps/api/src/main/java/com/biblequiz/modules/quiz/service/DailyMissionService.java)) định nghĩa 3 mission: `answer_correct` (target=3), `complete_daily_challenge` (target=1), `answer_combo` (target=3). **Production code chỉ gọi `trackProgress` đúng 1 lần** ở `DailyChallengeService.java:251` cho `complete_daily_challenge`. Hai mission còn lại không có call site nào — `progress` mãi = 0 → `completed` mãi = false → FE strikethrough không render ([DailyMissionsCard.tsx:87](apps/web/src/components/DailyMissionsCard.tsx)).

`trackProgress` hiện chỉ cộng dồn (`progress + increment`), không reset khi đáp sai — không phù hợp cho combo. Cần method riêng `trackComboProgress(userId, type, correct)`:
- Correct: `progress = min(progress+1, target)`. Đạt target → `completed=true`.
- Wrong + chưa completed: `progress = 0`.
- Đã completed: no-op (idempotent).

`DailyChallengeController#checkAnswer` ([line 100-113](apps/api/src/main/java/com/biblequiz/api/DailyChallengeController.java)) hiện không có `Authentication` param → cần thêm để track theo userId khi authenticated (guest answer bỏ qua).

## Tasks

- DM-TRACK-1 BE: thêm `DailyMissionService.trackComboProgress(userId, missionType, boolean correct)` — increment khi đúng, reset khi sai, idempotent khi completed. Gọi `checkAndGrantBonus` cuối method.
  - Status: [x] DONE
  - Files: `apps/api/src/main/java/com/biblequiz/modules/quiz/service/DailyMissionService.java`, test file
  - Test: BE Tầng 1 DailyMissionServiceTest 13/13 pass (8 cũ + 5 mới); Tầng 3 942 pass / 32 fail (= baseline state, 32 pre-existing env failures cần Docker/Testcontainers — verified bằng stash).
  - **Spec impact**: [x] None (mission catalog không đổi)
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: ✅ impl · ✅ Tầng 1+3 pass · ⏳ commit

- DM-TRACK-2 BE: hook `SessionService.submitAnswer` — sau line 449 (creditNonRankedProgress), gọi `dailyMissionService.trackProgress(user.id, "answer_correct", 1)` khi `isCorrect=true`, và `trackComboProgress(user.id, "answer_combo", isCorrect)` luôn (cả đúng/sai để reset streak). Wrap try/catch để không crash submit-answer khi mission tracking lỗi.
  - Status: [x] DONE
  - Files: `apps/api/src/main/java/com/biblequiz/modules/quiz/service/SessionService.java`
  - Test: BE Tầng 1 SessionServiceTest 38/38 pass; Tầng 3 942 pass / 32 pre-existing fail = baseline preserved.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: ✅ impl · ✅ Tầng 1+3 pass · ⏳ commit

- DM-TRACK-3 BE: thêm `Authentication` param vào `DailyChallengeController.checkAnswer` + hook tracking trong `DailyChallengeService.checkAnswer(questionId, selectedAnswer, userId)`. Guest (userId=null) skip tracking.
  - Status: [x] DONE
  - Files: `apps/api/src/main/java/com/biblequiz/api/DailyChallengeController.java`, `apps/api/src/main/java/com/biblequiz/modules/daily/service/DailyChallengeService.java`
  - Test: Không có unit test cho `checkAnswer` từ trước (verify bằng grep) — không cần update. Tầng 3 BE 942 pass / 32 pre-existing fail = baseline preserved.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: ✅ impl · ✅ Tầng 3 pass · ⏳ commit

- DM-TRACK-4 FE: invalidate `['daily-missions']` query sau khi `submitAnswer` đúng — để widget tick ngay không cần F5. Hook ở SessionAnswer mutation (Practice/Ranked) + Daily Challenge `handleAnswer`.
  - Status: [ ] TODO
  - Files: `apps/web/src/pages/DailyChallenge.tsx`, các hooks/components có submit-answer mutation
  - Test: Vitest mock — submit answer đúng → queryClient.invalidateQueries called với `['daily-missions']`. Tầng 3 FE no regression.
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Checklist: impl · Tầng 1+3 pass · commit
