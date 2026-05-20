# 2026-05-20 — Ranked spec catch-up: tier-difficulty distribution + UserQuestionHistory write

> **Source**: Audit user-driven 2026-05-20 — "phần câu hỏi khó hơn là đang gap so với spec à" + "hiện có cơ chế nào để user chơi không bị chơi lại câu hỏi khi chơi rank k". Phát hiện 2 gap nghiêm trọng giữa SPEC_USER §3.2 (tier-based difficulty) + UserQuestionHistory long-term scope.
> **Scope**: BE (`RankedController` + new endpoint) + FE (`Ranked.tsx`). KHÔNG đụng Practice / Mystery / Speed flows.

## Gap 1 — Tier-based difficulty distribution không enforce trên Ranked

**SPEC §3.2 promise**: T1 nhận 70% Easy / 25% Medium / 5% Hard, T6 nhận 5% E / 35% M / 60% H — câu khó dần theo tier.

**Code thực tế**: `Ranked.tsx` gọi `/api/questions?excludeIds=...&book={book}` → BE `QuestionService.getRandomQuestions` random uniform từ pool sách đó, KHÔNG filter tier. `TierDifficultyConfig.getDistribution()` chỉ được consume bởi `SmartQuestionSelector.selectQuestions()`, mà SmartQuestionSelector chỉ được gọi bởi `SessionService.startSession()` (Practice path) + `VarietyQuizController` (Mystery/Speed) + `AdminTestController.previewQuestions` — **không có path nào dẫn từ Ranked → SmartQuestionSelector**.

**Hệ quả**: T6 không nhận nhiều câu Hard hơn T1; promise "leo tier khó hơn" chỉ tồn tại qua XP multiplier (×2.0), không qua content khó.

## Gap 2 — Ranked không ghi UserQuestionHistory → không có long-term avoidance

**Cơ chế hiện tại**:
- Daily-scope: `UserDailyProgress.askedQuestionIds` (JSON list) reset 0h UTC mỗi ngày → trong ngày không repeat.
- Cross-day: KHÔNG có. Sang ngày mới, askedQuestionIds reset → câu cũ có thể quay lại.
- Lifetime: `UserQuestionHistory` table có sẵn (`timesSeen`, `lastSeenAt`, `nextReviewAt`), Practice flow `SessionService:763 userQuestionHistoryRepository.save(history)` ghi đúng — nhưng **`RankedController.submitRankedAnswer` không ghi vào**.

**Hệ quả**:
- User chơi Ranked 100 câu/ngày × 30 ngày = 3000 lần trả lời, KHÔNG câu nào enter UserQuestionHistory từ path Ranked.
- Profile stats `userQuestionHistoryRepository.countByUserId` (Profile "đã chơi N câu") thiếu count Ranked.
- Spaced-repetition (nextReviewAt) không khả thi cho Ranked → cross-day repeat không avoidable.

### Tasks

- RANK-CATCHUP-1 BE: tier-aware question select endpoint
  - Status: [x] DONE
  - Files: `apps/api/src/main/java/com/biblequiz/api/RankedController.java` (new endpoint) hoặc `RankedQuestionController` (new file)
  - **Approach (a)**: thêm endpoint `POST /api/ranked/questions/select` nhận body `{ limit:10, excludeIds:[], book?, currentDifficulty? }`, server-side: resolve `userId → tierLevel → TierDifficultyConfig.getDistribution(tier) → call SmartQuestionSelector.selectQuestions(userId, limit, filter)` rồi return `{ questions: [...] }`. SmartQuestionSelector đã có sẵn logic tier-aware + UserQuestionHistory-aware (Practice dùng) — chỉ cần reuse.
  - **Alternative considered**: gộp luôn vào `POST /api/ranked/sessions` để 1 round-trip — defer vì refactor lớn hơn (Ranked.tsx FE flow đang multi-step với 3 fallback queries).
  - Test: BE JUnit test `RankedControllerTest` — T1 user nhận distribution ~70/25/5, T6 user nhận ~5/35/60 ± noise.
  - **Spec impact**: [x] SPEC_USER §3.2 (drift fix — code catch up với canonical intent)
  - **Spec strategy**: [x] (a) update inline cùng PR — note rằng `TierDifficultyConfig.timerSeconds` legacy field (30→18s) vẫn được dùng cho Practice qua SmartQuestionSelector, chỉ Ranked timer dùng 90s flat per policy 2026-05-20.
  - Backlog ref: **BL-20** (sẽ add vào BACKLOG.md cùng commit)

- RANK-CATCHUP-2 FE: Ranked.tsx gọi endpoint mới thay vì manual select
  - Status: [x] DONE
  - Files: `apps/web/src/pages/Ranked.tsx`
  - Replace 3-fallback `/api/questions` queries (filtered → book-only → any-book) bằng 1 call `POST /api/ranked/questions/select` với body `{limit:10, excludeIds: [...serverAskedIds, ...localAskedIds]}`. BE return 10 câu tier-aware đã loại exclude — không cần FE fallback nữa (BE tự fallback nội bộ qua SmartQuestionSelector logic).
  - Giữ `noQuestionsLeft` guard nếu BE trả `questions.length === 0`.
  - Test: Ranked smoke test — start ranked quiz return ≥1 question.
  - **Spec impact**: [x] None (FE call shape thay đổi, behavior catch up spec)
  - **Spec strategy**: [x] (c) [no-spec-impact]

- RANK-CATCHUP-3 BE: RankedController.submitRankedAnswer ghi UserQuestionHistory
  - Status: [x] DONE
  - Files: `apps/api/src/main/java/com/biblequiz/api/RankedController.java`
  - Trong block `try { ... persist UDP ... }` đã có, sau khi save UDP → upsert `UserQuestionHistory` row (find by `userId + questionId`, bump `timesSeen`, set `lastSeenAt = now`, increment `timesCorrect` hoặc `timesWrong` theo isCorrect, optional set `nextReviewAt` theo Leitner box / spaced-repetition spec). Mirror pattern `SessionService.persistAnswer:736-763`.
  - Wrap try/catch — nếu UQH save fail (FK constraint, etc.), log warn nhưng KHÔNG fail Ranked submit response.
  - Test: BE JUnit `RankedControllerTest` — 1 lần submit → UQH row created với `timesSeen=1`. Lần 2 → `timesSeen=2`.
  - **Spec impact**: [x] SPEC_USER §3.2 / §21 (mastery + profile stats include Ranked)
  - **Spec strategy**: [x] (a) update inline — note rằng Ranked giờ contribute vào `seenQuestions/masteredQuestions/needReview` counts trong UserController stats.
  - Backlog ref: **BL-21** (sẽ add vào BACKLOG.md cùng commit)

- RANK-CATCHUP-4 (optional, defer to follow-up) FE: cross-day exclude bằng UserQuestionHistory recent-N IDs
  - Status: [ ] DEFER
  - Khi catchup-3 đã xong, có UQH data: FE có thể gọi `GET /api/me/recent-question-ids?days=7` rồi merge vào `excludeIds`. Tránh repeat trong 7 ngày gần nhất (chứ không chỉ trong ngày).
  - Defer vì cần xác định N days, performance impact (excludeIds list lớn), và policy "user thấy lại câu cũ sau bao lâu là OK" — chưa rõ.
  - Tracking sau khi RANK-CATCHUP-3 ship.

### Backlog entries to add (BACKLOG.md)

- **BL-20** — Ranked không enforce tier-based difficulty distribution. SPEC §3.2 promises Easy/Med/Hard% theo tier; code đi tắt qua `/api/questions` không qua SmartQuestionSelector. Fix: RANK-CATCHUP-1+2.
- **BL-21** — Ranked không ghi UserQuestionHistory → profile stats thiếu Ranked count, cross-day repeat possible. Fix: RANK-CATCHUP-3.

### Out of scope

- Practice / Mystery / Speed flows (đã work qua SmartQuestionSelector — không đụng).
- Spaced-repetition algorithm (nextReviewAt Leitner box) — task này chỉ ghi UQH; SR logic tách BL riêng.
- Cross-day exclude UX (RANK-CATCHUP-4) — defer.
- Mobile Ranked (`apps/mobile/`) — mobile flow có thể khác, tách task nếu cần parity.
