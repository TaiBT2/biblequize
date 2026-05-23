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
  - Status: [ ] TODO · Files: `apps/api/.../SmartQuestionSelectorStatsTest.java`
    (new)
  - For each tier, seed ≥ 1000 questions with even difficulty mix, call
    `selectQuestions(userId, 100, filterWithoutDifficulty)` 100 times, sum
    by difficulty. Assert observed % within ±5 of spec %.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SQS-2 BE: spaced-repetition mix
  - Status: [ ] TODO · Files: same
  - Seed: 200 unseen, 100 need-review, 200 seen >30d ago, 100 seen <30d ago.
    Call `selectQuestions(_, 100, _)` → assert ~60/20/15/5 (±10% tolerance).
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SQS-3 BE: excludeIds + askedQuestionIdsToday no-repeat-within-day
  - Status: [ ] TODO · Files: same
  - Call selector twice in a single day with the first call's IDs added
    to `askedQuestionIdsToday`; assert no overlap with first batch.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SQS-4 BE: language filter (vi vs en)
  - Status: [ ] TODO · Files: same
  - Seed half vi / half en questions; ask for `language="vi"` → assert
    100% returned are vi. Repeat for en. Pins BL-1 (BTTHĐ 2011) safety.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SQS-5 BE: coverage-book override
  - Status: [ ] TODO · Files: same
  - With feature flag on + a 3-book current week, selector must restrict
    to those 3 books regardless of `filter.book`.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SQS-6 BE: degenerate pools
  - Status: [ ] TODO · Files: same
  - 0 questions matching filter → empty list, no exception.
  - < limit questions matching → returns all available, no padding with nulls.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SQS-7 Doc: pin the SPEC §3.2 table in code
  - Status: [ ] TODO · Files: `TierDifficultyConfig.java`
  - Add a Javadoc table comment matching SPEC §3.2 so any future edit to
    the constants is reviewed against canonical numbers. (Drift here was
    the BL-20 root cause.)
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

## Acceptance

- Statistical tests pass with reasonable tolerance (±5% distribution,
  ±10% mix) and re-run flake-free 10 times in a row.
- Flipping any single constant in `TierDifficultyConfig` or the mix
  weights in `SmartQuestionSelector.selectIdsWithSmartHistory` fails a
  test with a clear message naming the spec value.
