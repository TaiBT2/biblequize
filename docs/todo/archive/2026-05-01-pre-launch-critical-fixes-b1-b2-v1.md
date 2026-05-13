# 2026-05-01 — Pre-launch Critical Fixes (B1 + B2 + V1) [DONE]

> Source: `docs/prompts/PROMPT_PRELAUNCH_CRITICAL.md` + investigation report.
> Investigation phase concluded PL-1 has NO BUG (review confused threshold display
> with actual user XP). Execution scope reduced to PL-3 + PL-2.

### Task PL-3: Practice CTA outline variant (V1) — visual hierarchy
- Status: [x] DONE 2026-05-01 — commit `b7832d0`
- File(s): `apps/web/src/components/GameModeGrid.tsx` (override className via existing FeaturedCard mechanism)
- Test: `apps/web/src/components/__tests__/GameModeGrid.test.tsx` (+2 cases: outline class assertion + ranked regression guard) — 15/15 pass

### Task PL-2: Leaderboard tie-break (B1)
- Status: [x] DONE 2026-05-01 — commit `858398b`
- File(s): `apps/api/src/main/java/com/biblequiz/modules/quiz/repository/UserDailyProgressRepository.java`
  (3 native SQL ORDER BY: daily/weekly/all-time + GROUP BY add `u.created_at`)
- Test: `apps/api/src/test/java/com/biblequiz/modules/quiz/repository/UserDailyProgressRepositoryTest.java`
  (schema-lock via reflection — no Testcontainers infra exists in project)
- Rationale: current ORDER BY = `points DESC, u.id ASC` → tie-break implicit by UUID.
  Implemented: `points DESC, questions DESC, u.created_at ASC` (fairness + determinism).
- E2E W-M17 deferred to sprint 1 per `tests/e2e/TC-TODO.md:38`.
- Commit: `fix: leaderboard tie-break by questions then createdAt (PL-2)`

### Task PL-1: DROP — no bug
- Status: [x] NOTED-NO-BUG 2026-05-01
- Investigation result: 3-layer chain (RankTier.fromPoints uses `>=`,
  `tiers.ts` getTierByPoints uses `>=` for minPoints, HeroStatSheet pointsToNext
  formula correct). Screenshot "Tier 1 - Còn 1.000 điểm" is the EXPECTED display
  for user with 0 XP (1.000 = threshold to next tier, not user's points).

---

## Defer post-launch — W-M02 home-tier-badge testid missing (5 smoke fails)

5 W-M02 home smoke cases fail because `getByTestId('home-tier-badge')` element
is not found on the Home page (timeout 5s):
- W-M02-L1-001 Home page render dung cho user da dang nhap
- W-M02-L1-002 Game mode grid hien thi du cac modes
- W-M02-L1-003 Tier progress bar hien thi tren Home
- W-M02-L1-004 Leaderboard section hien thi va toggle Daily/Weekly
- W-M02-L1-006 Navigate tu game mode card sang dung route

Verified pre-existing on `main` (commit `e6472d5`) by stashing the C3
diff and rerunning — same 5 failures. Not introduced by Path C / Path A.
Defer post-launch; investigate when the team has time to determine if
the testid is missing in Home.tsx or the Playwright fixture is stale.

---
