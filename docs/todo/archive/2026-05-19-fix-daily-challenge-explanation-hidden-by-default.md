# 2026-05-19 — Fix: Daily Challenge explanation panel auto-shows + covers answer options

> **Source**: User bug report 2026-05-19 (screenshot Galaxy S21 Ultra — panel "Đáp án đúng là..." auto-shown sau khi answer, đè lên answer C/D nên user không thấy đáp án đúng nào, không có cách tắt)
> **Scope**: `apps/web/src/pages/DailyChallenge.tsx` — apply collapse-by-default toggle pattern (match [Quiz.tsx:968-1037](../../../apps/web/src/pages/Quiz.tsx) nhưng default = collapsed)

## Root cause

DailyChallenge render explanation panel (lines 531-550) unconditionally khi `answered && (!isCorrect || currentExplanation)`. Panel `fixed bottom-48 sm:bottom-36` (~12rem above bottom) đè lên answer grid trên viewport ngắn (S21 Ultra 412×915 portrait). Không có toggle.

Quiz.tsx đã có pattern `explanationCollapsed` state + pill button "Xem giải thích" (i18n keys `quiz.showExplanationAgain`, `quiz.minimizeExplanation` sẵn). DailyChallenge chưa sync.

### Tasks

- DAILY-EXP-1 Apply collapsed-by-default explanation toggle pattern cho DailyChallenge
  - Status: [x] DONE
  - Files: `apps/web/src/pages/DailyChallenge.tsx`
  - Test: Tầng 1 DailyChallenge 6 pass / 1 fail (pre-existing mock issue verified bằng git stash — không phải do fix này; test mocks `isCorrect` thiếu, results=[false] → score=0 không match expected 20)
  - **Spec impact**: [x] None
  - **Spec strategy**: [x] (c) [no-spec-impact] (UX toggle, không đổi answer/scoring/flow)
  - Checklist: ✅ impl · ✅ Tầng 1 (no new failure) · ✅ commit
