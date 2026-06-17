# 2026-06-17 — AI distractor-quality parity cho user paths (quiz set + personal bank)

> **Source**: User — "AI user tạo câu hỏi đã áp dụng distractor như admin chưa" → prompt đã ngang admin, thiếu bước `annotateQuality` + surface.
> **Scope**: BE 3 endpoint (personal quiz set, group quiz set, personal bank) + FE quiz set editors. KHÔNG đổi DB (transient `_quality`, giống admin). KHÔNG review-gate.
> **Bối cảnh**: prompt Haladyna/NBME đã baked trong `AIGenerationService.buildPrompt` cho mọi MCQ → mọi path đã có. Chỉ admin gọi `annotateQuality` (AIAdminController:120). Quiz set lưu thẳng + response drop `_quality`/`distractors`. Personal bank endpoint không có FE caller (orphan) → chỉ làm BE.

### Tasks

- AEU-1 BE personal quiz set: annotateQuality + passthrough `_quality`/`distractors`
  - Status: [x] DONE · Files: `QuestionSetController.java` · Test: `QuestionSetControllerTest` (new, MockMvc) ✓
  - `annotateQuality(drafts)` sau khi gom drafts; zip `_quality`+`distractors` từ drafts[i] vào editorQuestion theo saved[i].id (saved cùng order với drafts).
  - **Spec impact**: [ ] None — surface quality, không đổi business rule · **Spec strategy**: [x] (c) `[no-spec-impact]`

- AEU-2 BE group quiz set: annotateQuality + passthrough
  - Status: [x] DONE · Files: `ChurchGroupController.java` · Test: `ChurchGroupControllerTest#quizSetAiGenerate_…` (new) ✓
  - `annotateQuality(allDrafts)`; zip `_quality`+`distractors` vào savedDtos theo order.
  - **Spec impact**: [ ] None · **Spec strategy**: [x] (c) `[no-spec-impact]`

- AEU-3 BE personal bank: adapter annotateQuality (no FE consumer)
  - Status: [x] DONE · Files: `GeminiQuizGeneratorAdapter.java` · Test: `GeminiQuizGeneratorAdapterTest` (new) ✓
  - REVISED scope: endpoint `/api/user-questions/generate` là orphan (không có FE/mobile caller) + entity không có cột distractors → KHÔNG extend GeneratedQuestionDTO (dead field). Chỉ gọi `annotateQuality(raw)` để chạy cùng validation + `logQualityIssues` warn khi distractor yếu. DTO-field/DB defer tới khi có FE consumer thật.
  - **Spec impact**: [ ] None · **Spec strategy**: [x] (c) `[no-spec-impact]`

- AEU-4 FE types + quality rendering (gộp vào QuestionEditor)
  - Status: [x] DONE · Files: `api/quizSets.ts` (DistractorMeta/QualityFlags + EditorQuestion fields) · Test: `QuestionEditor.quality.test.tsx`
  - REVISED: KHÔNG tạo component riêng — cả personal + group đều dùng chung `group/quizset-editor/QuestionEditor.tsx` (đã là Khung Sáng light palette). Render inline trong đó. Tái dùng i18n keys `admin.aiGenerator.draftCard.errorType/reason/*` (không thêm key mới → no i18n debt).
  - **Spec impact**: [x] None (UI) · **Spec strategy**: [x] (c) `[no-spec-impact]`

- AEU-5 FE wire vào quiz set editors (personal + group)
  - Status: [x] DONE · Files: `group/QuizSetEditor.tsx` (map `_quality`→`quality`), `QuestionEditor.tsx` (per-option errorType chip +★ + warning banner) · Test: vitest ✓
  - personalQuizSets.ts tái dùng EditorQuestion/AIGenerateForSetResponse từ quizSets.ts → tự động có field.
  - **Spec impact**: [x] None (UI) · **Spec strategy**: [x] (c) `[no-spec-impact]`

### Checklist
- mỗi task: impl · BE JUnit / FE vitest pass · Tầng 3 ≥ baseline · `audit.sh` no NEW broken · commit riêng
