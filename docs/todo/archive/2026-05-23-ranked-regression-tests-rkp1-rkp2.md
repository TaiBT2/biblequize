# 2026-05-23 — Ranked: regression tests for RKP-1 + RKP-2 bug fixes

> **Source**: lead-tester gap audit (2026-05-23 session)
> **Scope**: pin down the two ranked bugs fixed in commits 71e94f8 + 3260e6e
> with explicit regression tests so they cannot silently come back.

## Background

Two bugs hit production on 2026-05-22:

- **RKP-1** (FE) — "Chơi trận khác" on the ranked result screen replayed the
  same 10 questions (and reused the finished sessionId). Fixed in
  [Quiz.tsx](apps/web/src/pages/Quiz.tsx) by creating a fresh session +
  fresh question pick on replay.
- **RKP-2** (BE) — `POST /api/ranked/questions/select` returned raw JPA
  `Question` entities; uninitialized Hibernate lazy proxies left in the
  persistence context by `UserQuestionHistory` lookups crashed Jackson
  with `No serializer found for ByteBuddyInterceptor` → 500 →
  "Không thể bắt đầu thi đấu" toast. Fixed in [RankedController.java](apps/api/src/main/java/com/biblequiz/api/RankedController.java)
  by mapping to plain DTO maps.

Neither fix has a regression test, so the W-M04 e2e + unit suites would not
detect a recurrence.

## Tasks

- RGT-1 E2E: ranked replay produces a brand-new match
  - Status: [x] DONE · Files: `apps/web/tests/e2e/happy-path/web-user/W-M04-ranked.spec.ts`
  - Flow: start ranked → answer 10 → land on result → click "Chơi trận khác"
    → on the new /quiz page assert:
    - the new sessionId differs from the finished one (intercept both
      `POST /api/ranked/sessions` responses).
    - the question.id of the first card is NOT in the previously-served
      set (capture from the first `/questions/select` response).
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- RGT-2 BE: questions/select serializes when history has a Question proxy
  - Status: [x] DONE · Files: `apps/api/src/test/java/com/biblequiz/api/RankedControllerTest.java`
    (new or existing)
  - Set up a `@SpringBootTest` (or `@DataJpaTest`+controller slice) that:
    1. Persists a User + several Questions + a `UserQuestionHistory` row
       whose `question` ManyToOne is lazy.
    2. Calls `POST /api/ranked/questions/select` and asserts the response
       body parses cleanly (`questions[*].id`, `book`, `difficulty`, etc.).
    3. Asserts the response JSON does NOT contain `hibernateLazyInitializer`
       anywhere (defensive — guards a regression where someone reverts to
       returning the entity).
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- RGT-3 Unit: Quiz.tsx handlePlayAgain for ranked
  - Status: [x] DONE · Files: `apps/web/src/pages/__tests__/Quiz.replay.test.tsx`
    (new)
  - Mount Quiz at the result-screen state, mock the ranked endpoints, click
    play-again, assert `useNavigate` was called with `/quiz` + a fresh state
    object whose `sessionId` differs from the original. Guards the boot()
    full-reset + the startNextRankedMatch helper.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

## Acceptance

- 3 new tests, all green locally.
- Reverting commit 71e94f8 fails RGT-1 + RGT-3.
- Reverting commit 3260e6e fails RGT-2.
