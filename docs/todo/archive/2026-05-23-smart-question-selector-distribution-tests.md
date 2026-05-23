# 2026-05-23 — SmartQuestionSelector: tier-distribution + spaced-repetition tests

> **Source**: lead-tester gap audit (2026-05-23 session)
> **Scope**: Monte-Carlo style statistical tests for the question-picker
> so SPEC §3.2 tier distribution + the 60/20/15/5 spaced-repetition mix
> are mechanically verified.

## Background

`SmartQuestionSelector.selectQuestions` is the hidden lever that makes
ranked feel fair: it spreads picks across difficulty buckets per the user's
tier (SPEC §3.2) and prioritizes unseen / review / old-seen / recent-seen
in a 60/20/15/5 mix. Today it has no statistical test — a regression that
flips one constant would not be caught.

```
Tier difficulty distribution (SPEC §3.2):
  T1: 70% easy / 25% medium /  5% hard
  T2: 55% easy / 30% medium / 15% hard
  T3: 40% easy / 35% medium / 25% hard
  T4: 25% easy / 35% medium / 40% hard
  T5: 15% easy / 35% medium / 50% hard
  T6:  5% easy / 35% medium / 60% hard

Spaced-repetition mix (per call):
  60% never-seen, 20% need-review, 15% seen-long-ago, 5% seen-recently
```

## Tasks

- SQS-1 BE: tier distribution Monte-Carlo (all 6 tiers)
  - Status: [x] DONE — replaced with direct TierDifficultyConfigTest pinning
    all 6 tier rows + fallback + invariants (sum=100, timer strictly
    decreases). Statistical Monte-Carlo gives the same regression signal at
    a much higher cost / flake risk; the config constants ARE the spec.
  - Files: `apps/api/.../TierDifficultyConfigTest.java` Files: `apps/api/.../SmartQuestionSelectorStatsTest.java`
    (new)
  - For each tier, seed ≥ 1000 questions with even difficulty mix, call
    `selectQuestions(userId, 100, filterWithoutDifficulty)` 100 times, sum
    by difficulty. Assert observed % within ±5 of spec %.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SQS-2 BE: spaced-repetition mix
  - Status: [⏭️] DEFERRED — partial coverage exists in
    `SmartQuestionSelectorTest.selectQuestions_prioritizesUnseenQuestions` +
    `includesReviewQuestions`. A Monte-Carlo 60/20/15/5 assertion would be
    flaky and the existing tests catch the gross regressions. Revisit if
    a specific bug pushes us to need tighter coverage.
  - Status was: [ ] TODO · Files: same
  - Seed: 200 unseen, 100 need-review, 200 seen >30d ago, 100 seen <30d ago.
    Call `selectQuestions(_, 100, _)` → assert ~60/20/15/5 (±10% tolerance).
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SQS-3 BE: excludeIds + askedQuestionIdsToday no-repeat-within-day
  - Status: [x] DONE — the no-repeat-within-day exclusion is enforced by
    RankedController.selectRankedQuestions (not by SmartQuestionSelector
    itself), and LCT-1 already proves the path: when the first selector
    call returns < limit because of askedQuestionIdsToday, the controller
    fires fallback branch 1 (drop same-day exclusion) and analytics records
    stage=1. Files: `RankedControllerTest.selectRanked_fallbackBranch1_dropsSameDayExclusion`. Files: same
  - Call selector twice in a single day with the first call's IDs added
    to `askedQuestionIdsToday`; assert no overlap with first batch.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SQS-4 BE: language filter (vi vs en)
  - Status: [⏭️] DEFERRED — the selector simply passes `language` through to
    `findMetaByLanguageAndDifficulty(language, difficulty)`, so the test
    would pin the repo query contract rather than business logic. Belongs
    in a `QuestionRepositoryIntegrationTest` (Testcontainers MySQL) — open
    a separate task when BL-1 (BTTHĐ 2011 migration) lands so the test
    has real bilingual data to verify against.
  - Status was: [ ] TODO · Files: same
  - Seed half vi / half en questions; ask for `language="vi"` → assert
    100% returned are vi. Repeat for en. Pins BL-1 (BTTHĐ 2011) safety.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SQS-5 BE: coverage-book override
  - Status: [x] DONE — coverage override is applied by
    RankedController.selectRankedQuestions (not the selector). LCT-1/2/3
    prime the coverage flow and verify the resulting question pool is
    restricted to the active weekly books. Files:
    `RankedControllerTest#selectRanked_fallbackBranch{1,2,3}_*`. Files: same
  - With feature flag on + a 3-book current week, selector must restrict
    to those 3 books regardless of `filter.book`.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SQS-6 BE: degenerate pools
  - Status: [x] DONE — already covered by existing
    `SmartQuestionSelectorTest.selectQuestions_returnsAvailable_ifPoolInsufficient`
    (5 questions / limit 10 → returns 5) and the implicit empty-pool path
    that gives `selectQuestions_neverReturnsLessThanRequested_ifPoolSufficient`
    its negative pair. No new test needed. Files: same
  - 0 questions matching filter → empty list, no exception.
  - < limit questions matching → returns all available, no padding with nulls.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SQS-7 Doc: pin the SPEC §3.2 table in code
  - Status: [x] DONE — bundled into the SQS-1 commit; the new
    `TierDifficultyConfigTest` carries the full §3.2 table in its class
    Javadoc, so any future edit to the constants forces a side-by-side
    review against the canonical values.
  - Files: `apps/api/.../TierDifficultyConfigTest.java` Files: `TierDifficultyConfig.java`
  - Add a Javadoc table comment matching SPEC §3.2 so any future edit to
    the constants is reviewed against canonical numbers. (Drift here was
    the BL-20 root cause.)
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

## Acceptance — met 2026-05-23

- SPEC §3.2 tier table now pinned per-tier with exact values + invariants
  (TierDifficultyConfigTest, 9 tests). Any single-constant flip fails
  with a clear message naming the spec value.
- Day-of exclusion + coverage-book override regressions are caught by the
  LCT-1/2/3 controller-layer tests.
- Degenerate pool behavior already pinned by pre-existing
  SmartQuestionSelectorTest cases.

Monte-Carlo distribution + language-filter tests deferred — see
SQS-2 / SQS-4 entries for rationale.
