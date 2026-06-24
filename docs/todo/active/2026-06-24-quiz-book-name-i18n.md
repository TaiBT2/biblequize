# 2026-06-24 — Quiz: i18n tên sách (English → tiếng Việt)

> **Source**: user screenshot — màn Quiz hiện "Exodus: Chương 34" / "EXODUS 34:1" (English) thay vì tên VN. · **Scope**: FE `Quiz.tsx` display + `textHelpers.formatVerseRef`. [no-spec-impact].

### Tasks
- QBN-1 Localize `currentQuestion.book` ở 3 chỗ Quiz.tsx (topbar, desktop book-meta, wrong-exp verse) + badge verse-ref qua `formatVerseRef`
  - Status: [x] DONE — dùng `useBookName()` (English key → `nameVi` qua `/api/books`, fallback English) + `getQuizLanguage()`; `formatVerseRef(ref, bookName?)` thêm param override. Test: textHelpers +1 (override + fallback), FE 1416/1416, build OK.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]
