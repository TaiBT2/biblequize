# 2026-05-23 — Liturgical Coverage: pool-exhaustion fallback chain tests

> **Source**: lead-tester gap audit (2026-05-23 session)
> **Scope**: cover SPEC §7.11 pool-exhaustion chain + season transition +
> coverage badge + ×1.5 in-season bonus. Feature shipped 2026-05-21 with
> only the happy-path covered.

## Background

`POST /api/ranked/questions/select` applies a 3-step fallback when the
current liturgical week's book pool runs dry:

```
1. drop same-day exclusion (allow repeats within the day)
2. drop difficulty filter (mix the tier distribution)
3. set poolExhausted=true → FE shows "Unlock next week" CTA
```

None of the three fallback branches has an explicit test. The season
transition (Phục Sinh → Ngũ Tuần → Cảm Tạ → Giáng Sinh, C3 lock) and the
×1.5 in-season bonus also lack regression tests despite being canonical.

## Tasks

- LCT-1 BE: fallback branch 1 — drop same-day exclusion
  - Status: [ ] TODO · Files: `apps/api/.../RankedControllerTest.java` or
    new `LiturgicalCoverageFallbackTest`
  - Seed: feature flag on, user with `askedQuestionIdsToday` covering all
    current-week unseen questions but pool still has them ≥ limit.
  - Call `/questions/select` → assert response has `limit` questions and
    `coverageAnalytics.poolExhaustionFallback` was invoked with stage=1.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- LCT-2 BE: fallback branch 2 — drop difficulty filter
  - Status: [ ] TODO · Same files
  - Seed pool such that branch 1 still yields < limit but pool ignoring
    difficulty has ≥ limit. Assert response size + analytics stage=2.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- LCT-3 BE: fallback branch 3 — poolExhausted=true
  - Status: [ ] TODO · Same files
  - Seed empty current-week pool entirely. Assert response
    `poolExhausted=true`, `suggestedAction="UNLOCK_NEXT_WEEK"`, analytics
    stage=3.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- LCT-4 BE: `/coverage/unlock-next-week` cooldown + error codes
  - Status: [ ] TODO · Files: `LiturgicalCoverageServiceTest` or controller
    test
  - Cover: happy unlock; second unlock within cooldown → ERROR code;
    invalid season transition → ERROR code; max-week reached. Assert FE
    contract `{ error: "CODE" }` matches `coverage.unlockError.*` i18n keys.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- LCT-5 BE: season transition boundary
  - Status: [ ] TODO · Files: `LiturgicalSeasonServiceTest`
  - Parametric: clock at last-second of Phục Sinh → next call returns Ngũ
    Tuần. Verify all 4 season transitions in the year cycle (C3 lock).
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- LCT-6 BE: ×1.5 in-season scoring multiplier
  - Status: [ ] TODO · Files: `ScoringServiceTest` (overlap with SCD-2)
  - Same correct answer twice — once with `inSeason=true`, once with
    false; assert earned ratio == 1.5.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- LCT-7 BE: coverage badge award + `noti_24h_sent_at`
  - Status: [ ] TODO · Files: `AchievementServiceTest` or coverage badge
    service test
  - Complete a full week's coverage → badge awarded; 24h notification
    timestamp set; idempotent on repeat completion.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- LCT-8 E2E: pool-exhausted modal flow
  - Status: [ ] TODO · Files: `apps/web/tests/e2e/happy-path/web-user/W-M04-ranked.spec.ts`
  - Stub BE to return `poolExhausted=true` → click start → assert Sacred
    Modernist PoolExhaustedModal appears with "Unlock next week" CTA;
    click → assert `/coverage/unlock-next-week` posted; modal closes.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- LCT-9 E2E: feature-flag-off path keeps legacy filter
  - Status: [ ] TODO · Same files
  - Stub `featureFlagService.isLiturgicalCoverageEnabled=false` → assert
    BE returns questions without coverage-book restriction (legacy book
    filter) and FE hides CoverageCard.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

## Acceptance

- 3 fallback branches, 4 season transitions, ×1.5 bonus, badge, modal,
  feature-flag dual-path all have explicit tests.
- Reverting any of the §7 fallback logic causes a known test to fail.
