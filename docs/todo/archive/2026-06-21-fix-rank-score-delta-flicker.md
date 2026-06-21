# 2026-06-21 — Fix Ranked score-delta nhấp nháy "+0" trước khi hiện "+X"

> **Source**: user report 2026-06-21 — trả lời đúng câu Ranked, dòng điểm hiện "+0" trước rồi mới đổi "+X". · **Scope**: FE `apps/web/src/pages/Quiz.tsx` (chỉ phần hiển thị score-delta khi đúng). KHÔNG đụng business logic scoring (đó là BL-26 proposal).

### Root cause
`handleAnswerSelect` flip `setShowResult(true)` ngay (Quiz.tsx:373) → panel feedback render lập tức với `lastQuestionScore` đang = 0 (reset cho câu này). Điểm là **server-authoritative**, chỉ `setLastQuestionScore(earned)` sau khi `await api.post('/api/ranked/sessions/{id}/answer')` trả về (Quiz.tsx:539). Khoảng giữa → hiện "+0 Điểm thưởng", xong mới "+X".

### Tasks
- SDF-1 Gate dòng score-delta khi đang chờ điểm server
  - Status: [x] DONE — `scorePending` flag gate placeholder; i18n `quiz.calculatingPoints` vi/en; Quiz.test SDF-1 (deferred promise). Tầng 1: Quiz.test 20/20 · Tầng 3: web 1386/1386 (baseline 1277). i18n count không tăng.
  - Files: `apps/web/src/pages/Quiz.tsx`, `apps/web/src/i18n/{vi,en}.json`
  - Impl:
    - Thêm state `scorePending` (boolean). Set `true` cùng batch với `setShowResult(true)` trong `handleAnswerSelect`; set `false` ngay sau `setLastQuestionScore(questionScore)` (chạy mọi path, kể cả API fail).
    - Reset `scorePending=false` ở boot + `nextQuestion` (cùng chỗ reset `lastQuestionScore(0)`).
    - Render (Quiz.tsx:1196): khi `isCorrect && scorePending` → `t('quiz.calculatingPoints')`; `isCorrect && !pending` → `bonusPoints`; sai → `noPoints` (giữ nguyên, hiện ngay).
    - i18n key mới `quiz.calculatingPoints` (vi "Đang cộng điểm…", en "Scoring…").
  - Test: Vitest `Quiz.test.tsx` — deferred promise cho `/answer`: assert lúc pending KHÔNG có "+0", hiện calculating; sau resolve hiện "+8".
  - **Spec impact**: [x] None (UI display only, không đổi công thức điểm — behavior điểm số y nguyên)
  - **Spec strategy**: [x] (c) `[no-spec-impact]`
  - Checklist: impl · Tầng 1 (Quiz.test) · Tầng 2 (i18n validate) · Tầng 3 (web suite ≥ baseline) · commit `fix: ...[no-spec-impact]`
