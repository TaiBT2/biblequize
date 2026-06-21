# 2026-06-22 — BL-16 retire group leaderboard (Q-A sunset) + supersede BL-2/BL-12

> **Source**: User asked for BL-2 (filter group leaderboard by source). Verify-first found BL-2 is **obsolete**: the group leaderboard was sunset (GD-1, 2026-05-10, spec v1.4), replaced by Collective Growth (BL-23); endpoint has **0 callers** (web + mobile). Canonical resolution = **BL-16** (retire endpoint), not BL-2 (filter). User chose "làm BL-16 thay BL-2" (2026-06-22). · **Scope**: BE `ChurchGroupController`/`ChurchGroupService` + SPEC_GROUP §10 + BACKLOG. · **Spec strategy**: (a) update inline.

**Verify evidence:** `getLeaderboard` has 1 caller (the controller); web + mobile have 0 callers of `/groups/{id}/leaderboard`; the 3 `udpRepository` queries it used are shared (19/5/13 callers elsewhere) → leave repo + field untouched. No migration (dead-code removal only).

### Tasks
- BL16-1 BE: endpoint `GET /api/groups/{id}/leaderboard` → **410 Gone** `{ success:false, code:"LEADERBOARD_DEPRECATED", message }`; remove `ChurchGroupService.getLeaderboard` (dead); update controller test 200→410.
  - Status: [x] DONE · Files: `api/ChurchGroupController.java`, `service/ChurchGroupService.java`, `ChurchGroupControllerTest.java` · Test: `ChurchGroupControllerTest` PASS (410 + code assert)
  - **Spec impact**: [x] SPEC_GROUP §10 · **Spec strategy**: [x] (a) update inline
- BL16-2 Spec + backlog + regression: SPEC_GROUP §10 deprecation (now 410; point to Collective Growth §18) + v1.6.1 changelog; BACKLOG BL-16 → DONE, **BL-2 + BL-12 → SUPERSEDED by BL-16**; `audit.sh` no NEW broken; Tầng 3 (BE).
  - Status: [x] DONE · Files: `SPEC_GROUP_v1.3.md` §10 RETIRED + v1.6.1 changelog, `BACKLOG.md` (BL-16 DONE, BL-2/BL-12 SUPERSEDED) · `audit.sh` broken unchanged 102 (no NEW)
  - **Regression note (honest):** BL16-1 test (`ChurchGroupControllerTest`, 410) PASS. Full BE suite ran 1122 (≥ baseline 828) but **23 fail/error in date-sensitive suites** (StreakServiceTest, DailyMissionServiceTest, DailyChallengeServiceTest, RankedControllerTest, SessionServiceTest) — **pre-existing date-rollover flakiness** (same suite 1122/1122 at 2026-06-21 23:07; broke after midnight → 2026-06-22). NONE reference `getLeaderboard`/group; my diff (4 group-leaderboard files) adds 0 new failures. Date-flaky tests are out of BL-16 scope (candidate for a separate fix-task).
  - **Spec impact**: [x] SPEC_GROUP §10 + BL-2/BL-12/BL-16 · **Spec strategy**: [x] (a) update inline

### Definition of Done
- Endpoint returns 410 + structured code; dead `getLeaderboard` removed (no unused warnings); test asserts 410.
- SPEC_GROUP §10 reflects retired-state; BL-16 DONE, BL-2/BL-12 SUPERSEDED. `audit.sh` no NEW broken. BE Tầng 3 ≥ baseline 828.
