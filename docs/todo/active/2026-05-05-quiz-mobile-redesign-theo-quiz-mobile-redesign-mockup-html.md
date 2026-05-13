# 2026-05-05 — Quiz Mobile Redesign theo `quiz_mobile_redesign_mockup.html` [IN PROGRESS]

> **Source:** Bui yêu cầu mobile-only sweep cho Quiz screen — fix bug câu hỏi bị crop + redesign topbar/HUD.
> **Decisions Bui (2026-05-05):**
> - Q1: chỉ mobile (`<md` breakpoint), giữ nguyên desktop.
> - Q2: JS-based length detection 3 buckets (<80 / 80-180 / >180 chars).
> - Q3: verse pill BEFORE answer giữ behavior hiện tại.
> - Q4: bỏ score pill khỏi mobile header (move to HUD strip in QM-2).
> - Q5: giữ tất cả testIds hiện có; mobile-only timer dùng testId riêng `quiz-timer-mobile`.
> - Q6: combo banner + explanation panel ngoài scope.

### Task QM-1: Compact mobile topbar (1-row) [x] DONE 2026-05-05
- File(s): `apps/web/src/pages/Quiz.tsx` (header section lines 549-599)
- Spec:
  - Mobile: `[X close] · {counter + book} · 44px CircularTimer ring` — 1 row duy nhất
  - Bỏ score pill khỏi mobile (`hidden md:flex`)
  - Replace text-only timer circle bằng `CircularTimer size={44}` testId `quiz-timer-mobile`
  - Desktop unchanged (score pill + counter giữ nguyên)
- Checklist:
  - [x] Edit Quiz.tsx header (score pill `hidden md:flex`, mobile CircularTimer 44px testId `quiz-timer-mobile`)
  - [x] Vitest Quiz.test.tsx pass (19/19) + components/quiz (38/38)
  - [ ] Full regression (Tầng 3) — chạy ở QM-5
  - [ ] Commit: `style(quiz): compact mobile topbar with CircularTimer (QM-1)` — pending Bui approval

### Task QM-2: HUD strip 3-pill mobile (energy/combo/score) [x] DONE 2026-05-05
- File(s): `apps/web/src/pages/Quiz.tsx` (above Top Stats Row)
- Spec:
  - Mobile-only `<div data-testid="quiz-hud-mobile">` — `grid grid-cols-3 gap-2 mb-4`
  - 3 pills: ⚡ Energy (mini bars 1×2px) · ⭐ Combo `×N` · 💯 Score
  - Wrap existing Top Stats Row với `hidden md:flex` để desktop unchanged
  - Mobile energy bars: testId `quiz-energy-bars-mobile` (giữ desktop `quiz-energy-bars` cho E2E hiện tại)
- Checklist:
  - [x] Edit Quiz.tsx — mobile HUD strip + hide desktop stats row on `<md`
  - [x] Vitest 57/57 pass (Quiz 19 + components 38)
  - [ ] Commit pending
### Task QM-3: Question card flex + adaptive font + verse helper [x] DONE 2026-05-05
- File(s):
  - `apps/web/src/utils/textHelpers.ts` (+ `getQuestionLengthClass`)
  - `apps/web/src/utils/__tests__/textHelpers.test.ts` (+ 4 tests)
  - `apps/web/src/pages/Quiz.tsx` (question card mobile-only adaptive)
- Spec:
  - `getQuestionLengthClass(text)` → `'short' | 'medium' | 'long'` theo length (<80 / <180 / ≥180)
  - Mobile font: short=21px/700/center · medium=18px/600/center · long=15px/600/left
  - Mobile card: `aspect-auto min-h-[160px] p-5 rounded-2xl` (desktop `aspect-[21/7] p-10 rounded-[2.5rem]` unchanged)
  - Mobile bottom book-meta line ẩn (`hidden md:flex`) — đã có ở topbar
  - Verse badge top giữ nguyên (per Q3)
- Checklist:
  - [x] Helper + 4 tests (short/medium/long/null)
  - [x] Quiz.tsx adaptive question card mobile-only
  - [x] Vitest 79/79 pass (Quiz 19 + textHelpers 22 + components 38)
  - [ ] Commit pending
### Task QM-4: Compact answer mode mobile [x] DONE 2026-05-05
- File(s):
  - `apps/web/src/components/quiz/AnswerButton.tsx` (+ `compact` prop)
  - `apps/web/src/components/quiz/__tests__/AnswerButton.test.tsx` (+2 tests)
  - `apps/web/src/pages/Quiz.tsx` (apply `compact` khi `lenClass==='long'` + tighter mobile gap)
- Spec:
  - `compact=true`: mobile `min-h-44 p-2.5 letter-7 text-xs` (desktop unchanged via `md:` prefix)
  - Quiz grid mobile: `gap-2` (long Q) hoặc `gap-3`; desktop `md:gap-6` unchanged
  - testId `quiz-answers-grid`, `data-compact` attribute để E2E verify
- Checklist:
  - [x] AnswerButton compact prop + tests (2 tests)
  - [x] Quiz.tsx wire compact + tighter gap mobile
  - [x] Vitest 81/81 pass
  - [ ] Commit pending
### Task QM-5: E2E + full regression [x] DONE 2026-05-05
- Full FE regression: pre-QM 1166 tests (37 fail / 1129 pass) → post-QM 1172 tests (37 fail / 1135 pass)
  - QM thêm +6 tests (textHelpers +4 `getQuestionLengthClass`, AnswerButton +2 compact prop), tất cả pass
  - 37 failures là pre-existing (Ranked.test.tsx + DailyChallenge.test.tsx + 1 file khác) — đã xác nhận bằng `git stash` baseline run
  - **Số tests pass tăng** (1129→1135), không có regression do QM
- E2E selector audit (không cần update — desktop viewport unchanged):
  - `quiz-timer` desktop only; mobile dùng `quiz-timer-mobile` (testId mới, không conflict)
  - `quiz-energy-bars` desktop only; mobile dùng `quiz-energy-bars-mobile`
  - `quiz-question-book` ẩn `hidden md:flex` mobile (vẫn trong DOM cho Playwright)
  - `quiz-progress` đã desktop-only từ trước
- E2E mobile viewport spec mới: defer (giống HR-M precedent — cũng không thêm mobile spec)
- Checklist:
  - [x] Vitest full regression — pass count tăng 6, fails unchanged
  - [x] Audit E2E selectors — không có break
  - [ ] Commit QM-1..4 gộp 1 commit (theo HR-M precedent: `feat(quiz): mobile responsive sweep per quiz_mobile_redesign_mockup.html (QM)`)

---
