# 2026-05-20 — Quiz Set Editor i18n (group + personal shared)

> **Source**: User prompt 2026-05-20 — "page này chưa i18n"
> **Scope**: i18n toàn bộ Quiz Set Editor flow (8 files, ~70-80 strings). Shared editor → 1 lần fix cover cả `/groups/:id/quiz-sets/:setId/edit` (group) và `/my-sets/:setId/edit` (personal).
> **Status**: TODO

### Tasks

- I18N-1 Setup i18n keys infrastructure
  - Status: `[ ]` TODO · Files: `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` · Test: validator `npm run validate:i18n` không thêm missing keys
  - Namespace mới `quizSetEditor.*`. Bao gồm 66 Bible book name pairs (canonical VN ↔ EN — C4 cho phép both).
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1+2+3 pass · `audit.sh` no NEW broken · commit

- I18N-2 MetadataAccordion.tsx — book picker + language dropdown + placeholders
  - Status: `[ ]` TODO · Files: `apps/web/src/pages/group/quizset-editor/MetadataAccordion.tsx` · Test: smoke render
  - 24 VN strings; 66 sách Kinh Thánh (display label localized via i18n key, VN value vẫn là canonical đang lưu).
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- I18N-3 EditorTopBar.tsx — status badge + save/publish CTAs
  - Status: `[ ]` TODO · Files: `apps/web/src/pages/group/quizset-editor/EditorTopBar.tsx` · Test: smoke
  - 12 VN string lines.
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- I18N-4 QuestionSidebar.tsx — headers + add buttons + empty state
  - Status: `[ ]` TODO · Files: `apps/web/src/pages/group/quizset-editor/QuestionSidebar.tsx` · Test: smoke
  - 11 VN string lines.
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- I18N-5 QuestionEditor.tsx — difficulty pills + option labels + explanation + delete confirm
  - Status: `[ ]` TODO · Files: `apps/web/src/pages/group/quizset-editor/QuestionEditor.tsx` · Test: smoke
  - 20 VN string lines.
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- I18N-6 AIGeneratePanel.tsx — count inputs + generate CTA + quota messages + errors
  - Status: `[ ]` TODO · Files: `apps/web/src/pages/group/quizset-editor/AIGeneratePanel.tsx` · Test: smoke
  - 30 VN string lines (file lớn nhất).
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- I18N-7 AIRewriteModal.tsx — hint input + accept/reject buttons + preview labels
  - Status: `[ ]` TODO · Files: `apps/web/src/pages/group/quizset-editor/AIRewriteModal.tsx` · Test: smoke
  - 12 VN string lines.
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- I18N-8 PublishConfirmModal.tsx — validation messages + CTA
  - Status: `[ ]` TODO · Files: `apps/web/src/pages/group/quizset-editor/PublishConfirmModal.tsx` · Test: smoke
  - 12 VN string lines.
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- I18N-9 QuizSetEditor.tsx (parent shared) — loading/error states + AI errors + initial scope default
  - Status: `[ ]` TODO · Files: `apps/web/src/pages/group/QuizSetEditor.tsx` · Test: smoke
  - 16 VN string lines. Đụng cả group + personal route — verify cả 2 entry points.
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`

- I18N-10 Validate + regression
  - Status: `[ ]` TODO · Files: — · Test: `cd apps/web && npm run validate:i18n` + Tầng 3 regression (vitest)
  - Confirm hardcoded count không tăng beyond baseline (current: 648 lines accepted debt). Editor strings phải drop xuống.
  - **Spec impact**: `[x]` None
  - **Spec strategy**: `[x]` (c) `[no-spec-impact]`

### Out of scope (defer)

- Canonical book identifier migration (VN names stored vs English keys used elsewhere) — separate concern, không phải i18n.
- AI prompt template language (BE side) — đã có `language: 'vi' | 'en'` field passing through; backend implementation không thay đổi.
