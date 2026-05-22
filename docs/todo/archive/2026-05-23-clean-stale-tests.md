# 2026-05-23 — Clean up stale FE + BE tests

> **Source**: regression audit during ranked-play-fixes session (2026-05-22)
> **Scope**: bring `.test-baseline` files honest again — sync stale unit tests
> with the current shipped UI/contracts and fix broken test-slice configs.

## Background

Vitest baseline `apps/web/.test-baseline` = 1212 passing, but a clean run now
reports **69 failed / 1255 passed across 9 files**. JUnit baseline
`apps/api/.test-baseline` = 829, run reports **828 run / 1 failure + 36 errors**
(cascade from one slice misconfiguration).

Stash-comparison during the ranked work confirmed none of these are caused by
recent commits — they are pre-existing drift from prior redesign sprints.
Fixing them all is out of scope for any single feature task, so park them here.

## Failing FE files (9)

- `src/pages/__tests__/Ranked.test.tsx` — most volume; asserts the OLD Ranked
  page (current-book card, "Vào thi đấu" CTA, R3/R5/Coverage redesign). The
  desktop redesign (2026-05-20) + Liturgical Coverage sprint (2026-05-21) made
  these assertions obsolete. **Action**: rewrite against the redesigned page —
  use the testids verified in the W-M04 e2e suite.
- `src/pages/admin/__tests__/ReviewQueue.test.tsx` — "No QueryClient set"; test
  renders without `QueryClientProvider`. Same shape likely affects the other
  admin tests below.
- `src/pages/admin/__tests__/Events.test.tsx`
- `src/pages/admin/__tests__/Groups.test.tsx`
- `src/pages/admin/__tests__/Notifications.test.tsx`
- `src/pages/admin/__tests__/Rankings.test.tsx`
- `src/pages/__tests__/BasicQuiz.test.tsx` — "renders pass screen + CTA
  navigates to /ranked"; assertion drift, investigate.
- `src/pages/__tests__/DailyChallenge.test.tsx` — "POSTs /complete and
  invalidates tier caches" — tier-cache invalidation contract drift.
- `src/pages/__tests__/RoomQuiz.test.tsx`

## Failing BE tests (~37)

- `com.biblequiz.api.UserControllerTest` + `AdminUserControllerTest` — every
  test errors with *"ApplicationContext failure threshold exceeded"*. Root
  cause from surefire-report: `UserController` autowires
  `DailyCompletionRepository`, but the `@WebMvcTest`-style slice does not
  provide a `@MockBean` for it. **Action**: add `@MockBean DailyCompletionRepository`
  (and any other newly-added dependencies) to the slice config.
- `com.biblequiz.service.lifeline.LifelineServiceTest.useHint_unlimitedQuota_returnsMinusOneRemaining`
  — Mockito `UnnecessaryStubbingException` on `wireHappyPath` line 96.
  **Action**: drop the unused stub or mark the test class `@MockitoSettings(strictness = LENIENT)`.

## Tasks

- CST-1 Rewrite `Ranked.test.tsx` against the redesigned page
  - Status: [ ] TODO · Files: `apps/web/src/pages/__tests__/Ranked.test.tsx`
  - Reuse the testid map verified in `tests/e2e/pages/RankedPage.ts`. Drop
    assertions referencing removed UI (current book / OT-NT card).
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- CST-2 Wrap admin tests in `QueryClientProvider`
  - Status: [ ] TODO · Files: 5 admin __tests__ files (ReviewQueue, Events,
    Groups, Notifications, Rankings)
  - Most likely shared `renderWithProviders` helper drift — fix at the helper
    rather than each file if possible.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- CST-3 Fix BasicQuiz / DailyChallenge / RoomQuiz assertion drift
  - Status: [ ] TODO · Investigate each individually after CST-1/2.

- CST-4 Provide `DailyCompletionRepository` in `UserControllerTest` slice
  - Status: [ ] TODO · Files: `apps/api/.../UserControllerTest.java`,
    `AdminUserControllerTest.java`
  - Add the missing `@MockBean` so the WebMvc slice context loads.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- CST-5 Fix `LifelineServiceTest.wireHappyPath` unused stub
  - Status: [ ] TODO · Files: `apps/api/.../LifelineServiceTest.java`
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- CST-6 Refresh `.test-baseline` files
  - Status: [ ] TODO · Files: `apps/web/.test-baseline`, `apps/api/.test-baseline`
  - Run after CST-1..5 so the new pass counts gate future regression checks.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

## Acceptance

- `cd apps/web && npx vitest run` → 0 failed
- `cd apps/api && ./mvnw test -Dtest="com.biblequiz.api.**,com.biblequiz.service.**"` → 0 failed
- Updated `.test-baseline` files reflect the new pass counts (and only grow from here)
