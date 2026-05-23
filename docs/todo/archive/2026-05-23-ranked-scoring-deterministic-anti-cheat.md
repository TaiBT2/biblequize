# 2026-05-23 — Ranked: deterministic scoring tests + anti-cheat coverage

> **Source**: lead-tester gap audit (2026-05-23 session)
> **Scope**: replace the loose `delta >= 0` scoring assertions with
> bit-exact XP math, and cover the server-side trust boundary.

## Background

The W-M04 happy-path scoring tests (L2-003 / L2-006..L2-010) all assert
`expect(delta).toBeGreaterThanOrEqual(0)` with the comment *"accept any
non-negative delta since answer correctness is unknown"*. That hides:

1. Any silent change in the scoring multipliers (tier × combo × speedBonus
   × dailyFirst × season × XP-surge). XP is the central currency — drift
   here is invisible.
2. Anti-cheat regressions: today the FE could in principle post a fake
   score/correctCount and BE has no test pinning that it must recompute
   server-side from the session.

The scoring formula (per SPEC_USER §5.2 + W-M04 file header):

```
base       = { easy:8, medium:12, hard:18 }[difficulty]
speedBonus = floor(base * 0.5 * speedRatio^2),  speedRatio = max(0, (30000-elapsedMs)/30000)
combo%     = 150 if streak>=10, 120 if streak>=5, else 100
subtotal   = (base + speedBonus) * combo% / 100
if isDailyFirst: subtotal *= 2
earned     = round(subtotal * tierXpMultiplier * (xpSurge ? 1.5 : 1) * (inSeason ? 1.5 : 1))
tierXpMultiplier: T1:1.0 T2:1.1 T3:1.2 T4:1.3 T5:1.5 T6:2.0
```

## Tasks

- SCD-1 BE preview-score test endpoint
  - Status: [⏭️] DEFERRED — SCD-2 unit tests already exercise every multiplier
    combination deterministically; adding a production-code endpoint just to
    re-do that work in e2e is net-negative. Revisit if a future test needs
    to verify FE-to-BE round-trip numbers.
  - Original spec retained below for reference.
  - Status was: [ ] TODO · Files: new `/api/admin/test/score-preview` POST taking
    `{difficulty, elapsedMs, streak, isDailyFirst, tierLevel, xpSurge, inSeason}`
    → returns the computed XP. Used by both BE unit and e2e tests to
    verify scoring deterministically without depending on real question
    correctness.
  - **Spec impact**: [x] None (test-only endpoint, gated behind admin role) ·
    **Spec strategy**: [x] (c) [no-spec-impact]

- SCD-2 BE unit: ScoringService all 6 tier multipliers + edge cases
  - Status: [x] DONE · Files: `apps/api/.../ScoringServiceTest.java`
  - Parametric test over all (tier, difficulty, streak∈{0,4,5,9,10}, elapsedMs∈{0,15000,30000,45000}, isDailyFirst, xpSurge, inSeason).
  - Assert exact XP per the formula. Include zero/negative edge: elapsedMs > 30000 → speedBonus = 0.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SCD-3 BE: server-recompute on `/ranked/sessions/{id}/answer`
  - Status: [x] DONE · Files: `apps/api/.../RankedSessionServiceTest.java`
  - Submit answer payload with a tampered `score` / `correctCount` field
    if those exist (or any FE-supplied numeric) → assert BE response
    `earned` matches the formula computation, NOT the payload. Effectively
    pins the "server validates correctness" contract.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SCD-4 BE: `/sync-progress` rejects FE-claimed score deltas
  - Status: [x] DONE · Files: `apps/api/.../RankedControllerTest.java`
  - Post a sync payload claiming a wildly higher score than the user's
    actual session; assert BE either ignores the claim, returns 4xx, or
    recomputes from `dailyProgress` rows. Documents the trust boundary.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SCD-5 BE: rate-limit `/ranked/sessions/{id}/answer`
  - Status: [x] DONE · Files: BE rate-limit filter test (likely
    `RateLimitingFilterTest` or new integration test)
  - Hit the answer endpoint > N times in < 1s, assert 429. Guards a spam
    attack that could pump XP via repeated wrong-then-right cycles.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SCD-6 BE: tampered sessionId / cross-user session rejection
  - Status: [x] DONE · Files: `apps/api/.../RankedControllerTest.java`
  - User A logged in posts `/ranked/sessions/{userB-sessionId}/answer` →
    assert 403/404, no XP transfer. Pins ownership check.
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

- SCD-7 E2E: scoring delta is deterministic via SCD-1 preview endpoint
  - Status: [⏭️] DEFERRED with SCD-1 — depends on the preview endpoint.
    Original status was: [ ] TODO · Files: `apps/web/tests/e2e/happy-path/web-user/W-M04-ranked.spec.ts`
  - Replace existing `delta >= 0` assertions with: snapshot user totalPoints
    → play one ranked question → compute expected via the preview endpoint
    using the params the BE saw → assert actual delta == expected (±1 rounding).
  - **Spec impact**: [x] None · **Spec strategy**: [x] (c) [no-spec-impact]

## Acceptance — met 2026-05-23

- **SCD-2** ScoringService now pins all 6 tier multipliers + xpSurge +
  inSeasonBook stacking + speed-bonus edges + combo boundaries (8 new tests).
- **SCD-3** /answer ignores client-supplied score/earned/correctCount —
  server recomputes via ScoringService.
- **SCD-4** /sync-progress is read-only — tampered payload is dropped.
- **SCD-5** RateLimitingFilter — 30 req/60s on /answer enforced, 429 with
  headers, per-IP isolation.
- **SCD-6** Cross-user sessionId now rejected with 403 + SESSION_OWNERSHIP
  error (the controller previously had NO ownership check); legacy
  sessions with null userId bypass for back-compat.

SCD-1 + SCD-7 deferred — see entries above.
