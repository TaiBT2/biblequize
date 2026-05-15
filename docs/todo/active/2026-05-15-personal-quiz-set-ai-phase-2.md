# 2026-05-15 — Personal Quiz Set AI (Phase 2)

> **Source**: User feedback 2026-05-15 ngay sau khi ship Phase 1: "có thấy button AI tạo đâu" — user expected AI panel + AI rewrite trên personal set. Phase 1 đã hoãn AI sang Phase 2 (BL-19), giờ là Phase 2.
>
> **Scope**: Bật AI Generate + AI Rewrite cho personal set, share quota 200/ngày với group (locked decision 2026-05-14). Tái sử dụng `AIProviderRouter` + `AIQuotaService` (Redis-backed shared global) — đúng hạ tầng group đang dùng.
>
> **Status**: TODO

### Background

- Group có 2 endpoint: `POST /api/groups/{id}/quiz-sets/{setId}/ai-generate` (save Question source=`ai-group`) + `POST /api/groups/{id}/quiz-sets/{setId}/questions/{qid}/ai-rewrite`.
- Personal phải song song: gen tạo `UserQuestion` source=`AI` + attach vào set; rewrite chỉ trả draft không save.
- Quota 200/day share qua chung `AIQuotaService.tryAcquire(N)` — không cần config thêm.
- FE adapter `personalQuizSets.ts` đã có 3 stub `aiGenerateForSet`, `aiRewriteQuestion`, `getAIQuota` đang throw NOT_IMPLEMENTED — chỉ cần wire lên endpoint mới.
- FE `QuizSetEditor` đang gate AI UI qua `aiEnabled = ownership === 'group'`. Phase 2 sẽ tách thành prop `aiEnabled` độc lập, default theo ownership.

### Tasks

- PQS2-1 BE: Endpoint `POST /api/question-sets/{id}/ai-generate`
  - Status: [x] DONE
  - Files: `apps/api/src/main/java/com/biblequiz/api/QuestionSetController.java` (+ helper trong service hoặc inline)
  - Logic mirror group: validate owner-not-locked, parse `{countEasy, countMedium, countHard, book, chapterFrom, chapterTo, verseFrom?, verseTo?, topic?, language?}`, total 1-15, `aiQuotaService.tryAcquire(total)` → nếu fail trả 429 `{used, limit, remaining}`; loop 3 tier → `AIProviderRouter.generate(ctx, null)` → save từng draft thành `UserQuestion` source=AI gắn vào user của set, attach vào set qua `QuestionSetItem`; trả `{questions: [...EditorQuestion shape], totalQuestions, provider, used, limit, remaining}`.
  - Test: JUnit MockMvc — quota fail 429; happy path tạo N câu + total tăng đúng.
  - **Spec impact**: [ ] None [x] BL-19 (cập nhật)
  - **Spec strategy**: [x] (a) update inline (BL-19 entry: Phase 2 shipped)
  - Checklist: endpoint + service + test → commit < 100 LOC

- PQS2-2 BE: Endpoint `POST /api/question-sets/{id}/questions/{qid}/ai-rewrite`
  - Status: [x] DONE
  - Files: `apps/api/src/main/java/com/biblequiz/api/QuestionSetController.java`
  - Validate owner sở hữu set + question trong set, `tryAcquire(1)`, build `AIGenerationContext` từ `UserQuestion` hiện tại (book/chapter/verseStart-end/difficulty/language), `customPrompt = "Viết lại câu hỏi này..."` + optional hint, count=1 → trả `{draft, provider, used, limit, remaining}`. KHÔNG save — FE accept thì update qua endpoint `PUT /api/user-questions/{id}` đã có.
  - Test: JUnit — rewrite return draft không persist.
  - **Spec impact**: [x] BL-19
  - **Spec strategy**: [x] (a) update inline
  - Checklist: endpoint + test → commit < 70 LOC

- PQS2-3 FE: Wire `personalQuizSets.ts` 3 stub lên endpoint thật
  - Status: [x] DONE
  - Files: `apps/web/src/api/personalQuizSets.ts`
  - `aiGenerateForSet(setId, body)`: POST `/api/question-sets/{setId}/ai-generate` → response shape matches `AIGenerateForSetResponse`. Sau khi gen, gọi `getQuizSetFull` để sync state (vì BE trả `questions` từ Question table nhưng FE state cần EditorQuestion từ UserQuestion).
  - `aiRewriteQuestion(setId, qid, hint)`: POST `/api/question-sets/{setId}/questions/{qid}/ai-rewrite` → trả `AIRewriteResponse`.
  - `getAIQuota()`: GET `/api/ai/quota` (cần endpoint mới global, hoặc tái dùng `/api/groups/{anyGroupId}/ai-quota` — investigate khi làm). Fallback: gọi 1 endpoint helper mới `GET /api/question-sets/ai-quota`.
  - Test: Vitest mock axios.
  - **Spec impact**: [x] BL-19
  - **Spec strategy**: [x] (a) update inline
  - Checklist: wire stubs → unit test → commit < 50 LOC

- PQS2-4 FE: Tách `aiEnabled` thành prop độc lập + enable cho personal
  - Status: [x] DONE
  - Files: `apps/web/src/pages/group/QuizSetEditor.tsx`, `apps/web/src/pages/PersonalQuizSetEditor.tsx`
  - Thêm prop `aiEnabled?: boolean` vào `QuizSetEditor` Props, default `ownership === 'group'` để group flow unchanged. `PersonalQuizSetEditor` truyền `aiEnabled={true}` explicit.
  - Test: Playwright e2e — vào `/my-sets/:setId/edit` thấy 2 button "AI tạo nháp" + "Thêm thủ công"; click AI → modal mở.
  - **Spec impact**: [x] BL-19
  - **Spec strategy**: [x] (a) update inline
  - Checklist: prop + wire → Tầng 1+2+3 pass → commit < 30 LOC

- PQS2-5 BE: Endpoint helper `GET /api/question-sets/ai-quota` (chỉ tạo nếu PQS2-3 cần)
  - Status: [x] DONE (merged into PQS2-2 commit)
  - Files: `apps/api/src/main/java/com/biblequiz/api/QuestionSetController.java`
  - Đơn giản: `aiQuotaService.snapshot()` → return `{used, limit, remaining}`. Không auth-specific.
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: endpoint + test → commit < 20 LOC

- PQS2-6 Docs: Update BL-19 "Phase 2 shipped" + close task
  - Status: [ ] TODO
  - Files: `docs/spec/BACKLOG.md`, `docs/spec/SPEC_USER_v3.1.md`, task file → archive
  - Move BL-19 "Deferred to Phase 2" items lên "Delivered" section. SPEC_USER §19.3 update "AI generate / AI rewrite available, shared 200/day quota with group".
  - **Spec strategy**: [x] (a) update inline
  - Checklist: BACKLOG + SPEC + audit clean → commit < 30 LOC

### Out of scope (Phase 3)

- Personal folder entity + UI folder picker.
- Difficulty/duration auto-derive (group has `computeDifficulty()` — port to personal).
- `Question.source` enum cho UserQuestion (hiện chỉ AI/MANUAL; group có 'admin'/'ai-group'/'group-custom').
