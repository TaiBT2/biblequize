# 2026-05-22 — Ranked play fixes (replay + 500 + e2e sync)

> **Source**: user QA session — "chơi hạng" bugs · **Scope**: ranked match start/replay + e2e suite

### Tasks

- RKP-1 Fix "Chơi trận khác" replaying the same questions
  - Status: [x] DONE · Files: `apps/web/src/pages/Quiz.tsx` · Test: QuizResults vitest 19/19, manual
  - **Spec impact**: [x] None (bug fix — matches existing intent)
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Ranked replay now creates a fresh session + freshly-selected questions and
    re-navigates to /quiz; boot() fully resets quiz state.

- RKP-2 Fix HTTP 500 on POST /api/ranked/questions/select
  - Status: [x] DONE · Files: `apps/api/.../RankedController.java` · Test: compile clean, manual confirmed
  - **Spec impact**: [x] None (bug fix)
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Endpoint returned raw JPA Question entities; some were uninitialized
    Hibernate proxies → Jackson serialization failure. Now maps to plain DTO maps.

- RKP-3 Sync W-M04 ranked e2e suite with the redesigned Ranked page
  - Status: [x] DONE — W-M04: 18 passed / 0 failed / 3 skipped (was 17 failed)
  - Files: `apps/web/tests/e2e/pages/RankedPage.ts`,
    `apps/web/tests/e2e/global-setup.ts`, `apps/web/tests/e2e/smoke|happy-path/.../W-M04-ranked.spec.ts`,
    `apps/web/src/pages/Ranked.tsx` (testid only)
  - **Spec impact**: [x] None (test infra)
  - **Spec strategy**: [x] (c) [no-spec-impact]
  - Stale locators after the R3/R5 redesign + sticky-CTA refactor (a7c9db9):
    - `startBtn` targets `ranked-start-btn` (mobile footer, hidden on desktop)
      → use `ranked-start-btn-desktop`.
    - `expectStartDisabled` → button stays in DOM disabled → `toBeDisabled()`.
    - Missing testids: `ranked-today-progress`, `ranked-energy-timer`.
    - App renders English in Playwright (Chrome en-US); tests assert Vietnamese
      → seed `i18nextLng=vi` in global-setup storageState.
  - Checklist: impl · re-run W-M04 · commit
