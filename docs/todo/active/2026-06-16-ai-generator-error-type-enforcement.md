# 2026-06-16 — AI Generator: enforce error_type cho distractor

> **Source**: User — siết schema "mỗi distractor 1 loại lỗi khác nhau", reject khi trùng
> **Scope**: BE prompt + validation + FE types + DraftCard · **Spec**: SPEC_ADMIN §7.1 (a) inline
> **Cơ chế**: server annotate quality flags → FE hiện error_type + chặn Duyệt khi invalid (review-gate). KHÔNG auto-retry server (defer).

### Tasks

- AEQ-1 BE prompt: thêm schema `distractors[]` + enum errorType
  - Status: [x] DONE · Files: `AIGenerationService.java` · Test: `AIGenerationPromptTest`
  - MCQ output JSON thêm field `distractors`: 3 object `{index, errorType, almostRight}`; enum keys `nearby_passage|wrong_detail|wrong_scope|common_misconception|true_but_off`; nhắc 3 errorType phải khác nhau. vi + en.
  - **Spec impact**: [x] SPEC_ADMIN §7.1 · **Spec strategy**: [x] (a) inline

- AEQ-2 BE validation: `annotateQuality()` + gọi trong controller
  - Status: [x] DONE · Files: `AIGenerationService.java`, `AIAdminController.java` · Test: new unit test
  - Cho MCQ: đọc `distractors`, tính `duplicateErrorType`, `almostRightCount`, `requiredAlmostRight` (easy0/med1/hard2), `valid`, `reasons[]`. Gắn `_quality` vào mỗi question map. Controller gọi sau `providerRouter.generate` (không áp cho mock).
  - **Spec impact**: [x] SPEC_ADMIN §7.1 · **Spec strategy**: [x] (a) inline

- AEQ-3 FE types + mapping
  - Status: [x] DONE · Files: `ai-generator/types.ts`, `AIQuestionGenerator.tsx`
  - DraftQuestion += `distractors?`, `quality?`. Map `q.distractors` + `q._quality` trong handleGenerate. saveEdit clear `quality` (admin override).
  - **Spec impact**: [x] None (FE plumbing) · **Spec strategy**: [x] (c) [no-spec-impact]

- AEQ-4 FE DraftCard: hiện error_type + chặn Duyệt khi invalid
  - Status: [x] DONE · Files: `ai-generator/DraftCard.tsx` + i18n vi/en
  - View mode: mỗi distractor hiện nhãn errorType (+★ almost-right). Banner cảnh báo khi `!quality.valid` (list reasons). Disable nút Duyệt + tooltip khi invalid. i18n keys errorType/reason/almostRight/qualityWarning.
  - **Spec impact**: [x] None (UI) · **Spec strategy**: [x] (c) [no-spec-impact]

### Checklist
- impl từng task · BE JUnit (AIGenerationPromptTest + new) pass · FE vitest pass · Tầng 3 ≥ baseline · spec §7.1 updated · commit
